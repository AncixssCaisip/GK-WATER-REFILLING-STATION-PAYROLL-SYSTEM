import * as employeeController from '../controllers/employeeController.js';
import express from "express";

const employeeRoutes = express.Router();

employeeRoutes.get('/', employeeController.fetchAllEmployees);
employeeRoutes.post('/', employeeController.createEmployees);
employeeRoutes.put('/:id', employeeController.editEmployees);
employeeRoutes.delete('/:id', employeeController.deleteEmployees);

export default employeeRoutes;


// Employee portal routes (used by EmployeeDashboard.jsx)
import * as attendanceController from '../controllers/attendanceController.js';
import { sendError } from '../utils/appError.js';
import * as employeeModel from '../models/employeeModel.js';
import * as attendanceModel from '../models/attendanceModel.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import pool from '../config/db.js';

// GET /api/employees/profile — employee views their own profile (identified by username)
employeeRoutes.get('/profile', async (req, res) => {
    try {
        const username = (req.query.username || req.query.emp_code || '').trim().toLowerCase()
        if (!username) return res.status(400).json({ message: 'username is required.' })

        // Find by username in users table first, then get employee record
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username])
        if (!users.length) return res.status(404).json({ message: 'Employee not found.' })
        const user = users[0]

        // Get employee record via employee_id
        const employee = user.employee_id ? await employeeModel.findById(user.employee_id) : null
        if (!employee) return res.status(404).json({ message: 'Employee not found.' })

        res.json({
            id: employee.id,
            name: employee.name,
            employeeCode: employee.emp_code,
            position: employee.position,
            status: employee.status,
            username: user.username,
            phone: employee.phone || '',
            address: employee.address || '',
            email: employee.email || '',
        })
    } catch (e) { sendError(res, e) }
})

// Helper — get employee by username
async function getEmployeeByUsername(username) {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username.toLowerCase()])
    if (!users.length) return null
    const user = users[0]
    if (!user.employee_id) return null
    const employee = await employeeModel.findById(user.employee_id)
    return employee ? { ...employee, userId: user.id, password_hash: user.password_hash } : null
}

// PUT /api/employees/profile — employee updates their own contact info
employeeRoutes.put('/profile', async (req, res) => {
    try {
        const username = (req.query.username || req.query.emp_code || '').trim().toLowerCase()
        if (!username) return res.status(400).json({ message: 'username is required.' })
        const employee = await getEmployeeByUsername(username)
        if (!employee) return res.status(404).json({ message: 'Employee not found.' })
        const { name, phone, address } = req.body
        await pool.query('UPDATE employees SET name = ?, phone = ?, address = ? WHERE id = ?', [name || employee.name, phone || '', address || '', employee.id])
        res.json({ message: 'Profile updated.' })
    } catch (e) { sendError(res, e) }
})

// GET /api/employees/attendance — employee views their own attendance
employeeRoutes.get('/attendance', async (req, res) => {
    try {
        const username = (req.query.username || req.query.emp_code || '').trim().toLowerCase()
        if (!username) return res.status(400).json({ message: 'username is required.' })
        const employee = await getEmployeeByUsername(username)
        if (!employee) return res.status(404).json({ message: 'Employee not found.' })
        const [rows] = await pool.query(
            'SELECT id, date, time_in AS timeIn, time_out AS timeOut, total_hours AS totalHours, is_late AS isLate, IF(is_late, "Late", "On time") AS status FROM attendance WHERE employee_id = ? ORDER BY id DESC',
            [employee.id]
        )
        res.json(rows)
    } catch (e) { sendError(res, e) }
})

// POST /api/employees/attendance — employee time in / time out via QR scan
employeeRoutes.post('/attendance', async (req, res) => {
    try {
        const { action, qrValue } = req.body
        const type = action === 'time-out' ? 'out' : 'in'
        res.json(await (await import('../services/attendanceService.js')).punch(qrValue, type))
    } catch (e) { sendError(res, e) }
})

// PUT /api/employees/password — employee changes their own password
employeeRoutes.put('/password', async (req, res) => {
    try {
        const username = (req.query.username || req.query.emp_code || '').trim().toLowerCase()
        if (!username) return res.status(400).json({ message: 'username is required.' })
        const employee = await getEmployeeByUsername(username)
        if (!employee) return res.status(404).json({ message: 'Employee not found.' })
        if (!verifyPassword(req.body.current, employee.password_hash)) return res.status(400).json({ message: 'The current password is incorrect.' })
        if (!req.body.next || req.body.next.length < 8) return res.status(400).json({ message: 'Use a password with at least 8 characters.' })
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(req.body.next), employee.userId])
        res.json({ message: 'Password changed.' })
    } catch (e) { sendError(res, e) }
})
