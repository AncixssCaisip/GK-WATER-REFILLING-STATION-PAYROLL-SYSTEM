import * as payrollService from "../services/payrollService.js"
import { sendError } from "../utils/appError.js"

export const calculatePayroll = async (req, res) => {
  try {
    const { period_start, period_end } = req.body
    res.status(200).json(await payrollService.calculatePayroll(period_start, period_end))
  } catch (e) { sendError(res, e) }
}

export const approvePayroll = async (req, res) => {
  try {
    res.json(await payrollService.approvePayroll(req.params.id))
  } catch (e) { sendError(res, e) }
}

export const getPayrollHistory = async (req, res) => {
  try {
    res.json(await payrollService.getPayrollHistory())
  } catch (e) { sendError(res, e) }
}

export const getPayrollPeriod = async (req, res) => {
  try {
    res.json(await payrollService.getPayrollPeriod(req.params.id))
  } catch (e) { sendError(res, e) }
}

export const addCashAdvance = async (req, res) => {
  try {
    res.json(await payrollService.addCashAdvance(req.body))
  } catch (e) { sendError(res, e) }
}
