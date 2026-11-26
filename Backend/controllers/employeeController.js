import * as employeeService from "../services/employeeService.js";
import { sendError } from "../utils/appError.js";

export const fetchAllEmployees = async (req, res) => {
    try {
        const employees = await employeeService.fetchAllEmployees();
        res.status(200).json(employees);
    } catch (e) {
        sendError(res, e);
    }
};

export const createEmployees = async (req, res) => {
    try {
        const employee = await employeeService.createEmployees(req.body);
        res.status(200).json({ success: true, message: employee.id, employee });
    } catch (e) {
        sendError(res, e);
    }
};

export const editEmployees = async (req, res) => {
    try {
        const updated = await employeeService.updateEmployees(parseInt(req.params.id), req.body);
        res.status(200).json({ success: true, message: updated });
    } catch (e) {
        sendError(res, e);
    }
};

export const deleteEmployees = async (req, res) => {
    try {
        const deleted = await employeeService.deleteEmployees(parseInt(req.params.id));
        res.status(200).json({ success: true, message: deleted });
    } catch (e) {
        sendError(res, e);
    }
};
