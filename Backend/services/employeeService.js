import * as employeeModel from '../models/employeeModel.js';
import * as userModel from '../models/userModel.js';
import * as notificationModel from '../models/notificationModel.js';
import { AppError } from '../utils/appError.js';
import { hashPassword } from '../utils/password.js';

const clean = (b) => ({
    name: (b.name || '').trim(),
    position: (b.position || '').trim(),
    basic_salary: parseFloat(b.basic_salary) || 0,
    allowance: parseFloat(b.allowance) || 0,
    commission: parseFloat(b.commission) || 0,
    status: b.status === 'Inactive' ? 'Inactive' : 'Active',
});

const validate = (e) => {
    if (!e.name || !e.position) throw new AppError('Name and position are required.');
    if (e.basic_salary < 0 || e.allowance < 0 || e.commission < 0) throw new AppError('Amounts cannot be negative.');
};

// username + password + role of the employee account
const readAccount = async (body) => {
    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';
    // Auto-detect role based on position
    const position = (body.position || '').trim().toLowerCase();
    const role = position === 'driver' ? 'driver' : 'employee';
    if (!username || !password) throw new AppError('Username and password are required for the employee account.');
    if (/\s/.test(username)) throw new AppError('The username cannot have spaces.');
    if (password.length < 8) throw new AppError('Use a password of at least 8 characters.');
    if (await userModel.findByUsername(username)) throw new AppError('That username is taken.');
    return { username, password_hash: hashPassword(password), role };
};

export const fetchAllEmployees = async () => employeeModel.fetch();

// Add employee = employee record + login account + the ID that goes into the QR code
export const createEmployees = async (body) => {
    const employee = clean(body);
    validate(employee);
    const account = await readAccount(body);
    const id = await employeeModel.insert(employee, account);

    // If driver role — also insert into drivers table
    if (account.role === 'driver') {
        const pool = (await import('../config/db.js')).default;
        const empCode = `GK-${String(id).padStart(3, '0')}`;
        const [dResult] = await pool.query(
            `INSERT INTO drivers (name, emp_code, position, status) VALUES (?, ?, ?, 'Available')`,
            [employee.name, empCode, employee.position || 'Driver']
        );
        await pool.query(
            'UPDATE users SET driver_id = ? WHERE username = ?',
            [dResult.insertId, account.username]
        );
    }

    await notificationModel.insert('Employee added: ' + employee.name);
    return employeeModel.findById(id);
};

export const updateEmployees = async (id, body) => {
    const existing = await employeeModel.findById(id);
    if (!existing) throw new AppError('Employee not found.', 404);
    const employee = { id, ...clean(body) };
    validate(employee);

    if (existing.username) {
        if (body.password) {                      // optional password reset
            if (body.password.length < 8) throw new AppError('Use a password of at least 8 characters.');
            await userModel.updatePasswordByEmployee(id, hashPassword(body.password));
        }
    } else if (body.username || body.password) { // older employee that has no account yet
        const account = await readAccount(body);
        await userModel.insert({ name: employee.name, username: account.username, password_hash: account.password_hash, role: 'employee', employee_id: id });
    }
    return employeeModel.update(employee);
};

export const deleteEmployees = async (id) => {
    const employee = await employeeModel.findById(id);
    if (!employee) throw new AppError('Employee not found.', 404);
    const deleted = await employeeModel.remove(id);
    await notificationModel.insert('Employee removed: ' + employee.name);
    return deleted;
};
