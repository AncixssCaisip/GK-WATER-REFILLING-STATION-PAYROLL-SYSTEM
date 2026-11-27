import * as employeeModel from '../models/employeeModel.js'
import * as notificationModel from '../models/notificationModel.js'
import * as settingsModel from '../models/settingsModel.js'
import { getSettings } from './settingsService.js'
import { AppError } from '../utils/appError.js'
import pool from '../config/db.js'

// Get driver commission earned in period
async function getDriverCommission(driverName, period_start, period_end) {
  const [rows] = await (await import('../db.js')).default.query(
    `SELECT COALESCE(SUM(driver_commission), 0) AS total
     FROM orders
     WHERE driver = ? AND status = 'Delivered'
     AND date BETWEEN ? AND ?`,
    [driverName, period_start, period_end]
  )
  return Number(rows[0]?.total || 0)
}
async function getAttendanceInPeriod(period_start, period_end) {
  const [rows] = await pool.query(
    `SELECT employee_id, total_hours
     FROM attendance
     WHERE date BETWEEN ? AND ? AND time_out IS NOT NULL`,
    [period_start, period_end]
  )
  return rows
}

// Get cash advances for a period
async function getCashAdvances(period_start, period_end) {
  const [rows] = await pool.query(
    `SELECT employee_id, SUM(amount) AS total
     FROM cash_advances
     WHERE period_start = ? AND period_end = ?
     GROUP BY employee_id`,
    [period_start, period_end]
  )
  return rows
}

export const calculatePayroll = async (period_start, period_end) => {
  if (!period_start || !period_end)
    throw new AppError('Period start and end dates are required.')

  const start = new Date(period_start)
  const end   = new Date(period_end)
  if (isNaN(start) || isNaN(end)) throw new AppError('Invalid dates.')
  if (start > end) throw new AppError('Period start must be before period end.')

  // Check if already approved
  const [existing] = await pool.query(
    "SELECT * FROM payroll_periods WHERE period_start = ? AND period_end = ?",
    [period_start, period_end]
  )
  if (existing.length && existing[0].status === 'Approved')
    throw new AppError('This period has already been approved. You cannot recompute an approved payroll.')

  const { workdays, hours } = await getSettings()
  const employees  = (await employeeModel.fetch()).filter((e) => e.status === 'Active')
  const records    = await getAttendanceInPeriod(period_start, period_end)
  const advances   = await getCashAdvances(period_start, period_end)

  // Count working days in period (Mon–Sat)
  let periodDays = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    if (cursor.getDay() !== 0) periodDays++
    cursor.setDate(cursor.getDate() + 1)
  }
  if (periodDays < 1) periodDays = 1

  const rows = await Promise.all(employees.map(async (e) => {
    const empRecords  = records.filter((r) => r.employee_id === e.id)
    const workedHours = empRecords.reduce((sum, r) => sum + Number(r.total_hours || 0), 0)
    const expectedHours = periodDays * hours

    const periodSalary    = (e.basic_salary / workdays) * periodDays
    const periodAllowance = (e.allowance    / workdays) * periodDays

    // For drivers — commission comes from deliveries, not from employee commission field
    let periodCommission
    if (e.role === 'driver') {
      periodCommission = await getDriverCommission(e.name, period_start, period_end)
    } else {
      periodCommission = (e.commission / workdays) * periodDays
    }

    const undertime  = Math.max(0, expectedHours - workedHours)
    const hourlyRate = periodSalary / (periodDays * hours)
    const deduction  = Math.round(undertime * hourlyRate * 100) / 100

    const advanceRow   = advances.find((a) => a.employee_id === e.id)
    const cash_advance = advanceRow ? Number(advanceRow.total) : 0

    const net = Math.round((periodSalary + periodAllowance + periodCommission - deduction - cash_advance) * 100) / 100

    return {
      employee_id: e.id,
      id:          e.emp_code,
      name:        e.name,
      role:        e.role || 'employee',
      basic:       Math.round(periodSalary    * 100) / 100,
      allowance:   Math.round(periodAllowance * 100) / 100,
      commission:  Math.round(periodCommission * 100) / 100,
      deduction,
      cash_advance,
      net,
    }
  }))

  const totalDeduction = rows.reduce((s, r) => s + r.deduction, 0)
  const totalPayroll   = rows.reduce((s, r) => s + r.net, 0)

  // Save/update payroll period
  if (existing.length) {
    await pool.query(
      "UPDATE payroll_periods SET total_payroll = ?, status = 'Pending' WHERE id = ?",
      [totalPayroll, existing[0].id]
    )
    await pool.query("DELETE FROM payroll_items WHERE period_id = ?", [existing[0].id])
    var periodId = existing[0].id
  } else {
    const [result] = await pool.query(
      "INSERT INTO payroll_periods (period_start, period_end, total_payroll, status) VALUES (?, ?, ?, 'Pending')",
      [period_start, period_end, totalPayroll]
    )
    var periodId = result.insertId
  }

  // Save payroll items
  for (const r of rows) {
    await pool.query(
      `INSERT INTO payroll_items (period_id, emp_code, name, basic, allowance, commission, deduction, cash_advance, net)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [periodId, r.id, r.name, r.basic, r.allowance, r.commission, r.deduction, r.cash_advance, r.net]
    )
  }

  await settingsModel.save('total_deduction', totalDeduction)
  await notificationModel.insert(`Payroll computed: ${period_start} to ${period_end}`)

  return {
    period_id: periodId,
    rows,
    period_start,
    period_end,
    period_days: periodDays,
    total_payroll: totalPayroll,
    status: 'Pending',
  }
}

export const approvePayroll = async (period_id) => {
  const [rows] = await pool.query("SELECT * FROM payroll_periods WHERE id = ?", [period_id])
  if (!rows.length) throw new AppError('Payroll period not found.')
  if (rows[0].status === 'Approved') throw new AppError('This payroll is already approved.')

  await pool.query(
    "UPDATE payroll_periods SET status = 'Approved', approved_at = NOW() WHERE id = ?",
    [period_id]
  )
  await notificationModel.insert(`Payroll approved: ${rows[0].period_start} to ${rows[0].period_end}`)
  return { message: 'Payroll approved successfully.' }
}

export const getPayrollHistory = async () => {
  const [periods] = await pool.query(
    "SELECT * FROM payroll_periods ORDER BY id DESC"
  )
  return periods
}

export const getPayrollPeriod = async (period_id) => {
  const [periods] = await pool.query("SELECT * FROM payroll_periods WHERE id = ?", [period_id])
  if (!periods.length) throw new AppError('Payroll period not found.')
  const [items] = await pool.query("SELECT * FROM payroll_items WHERE period_id = ?", [period_id])
  return { ...periods[0], rows: items }
}

export const addCashAdvance = async ({ employee_id, amount, period_start, period_end, note }) => {
  if (!employee_id || !amount || !period_start || !period_end)
    throw new AppError('All fields are required.')
  if (Number(amount) <= 0) throw new AppError('Amount must be greater than zero.')
  await pool.query(
    "INSERT INTO cash_advances (employee_id, amount, period_start, period_end, note) VALUES (?, ?, ?, ?, ?)",
    [employee_id, amount, period_start, period_end, note || null]
  )
  return { message: 'Cash advance added.' }
}
