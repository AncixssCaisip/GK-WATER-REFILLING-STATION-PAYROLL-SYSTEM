import * as employeeModel from '../models/employeeModel.js';
import * as attendanceModel from '../models/attendanceModel.js';
import * as notificationModel from '../models/notificationModel.js';
import { getSettings } from './settingsService.js';
import { AppError } from '../utils/appError.js';
import { today, now } from '../utils/dateTime.js';
import pool from '../config/db.js';

export const fetchAllAttendance = async () => attendanceModel.fetchAll();

// Time in / time out of one employee (the QR code holds the employee ID, e.g. GK-001)
export const punch = async (code, type) => {
    const empCode = String(code || '').trim().toUpperCase();
    const employee = await employeeModel.findByCode(empCode);
    if (!employee) throw new AppError(`No employee with ID "${empCode}". Check the ID and try again.`);
    if (employee.status !== 'Active') throw new AppError(`${employee.name} is inactive.`);

    const date = today(), time = now();
    const open = await attendanceModel.findOpen(employee.id, date);
    const base = { name: employee.name, position: employee.position, time };

    if (type === 'in') {
        if (open) throw new AppError(`${employee.name} already timed in at ${open.time_in.slice(0, 5)}.`)

        // Check if already completed attendance today (timed in AND timed out)
        const [completed] = await pool.query(
            'SELECT id FROM attendance WHERE employee_id = ? AND date = ? AND time_out IS NOT NULL',
            [employee.id, date]
        )
        if (completed.length) throw new AppError(`${employee.name} has already completed attendance for today.`)

        const { start_time } = await getSettings();
        const late = time > start_time;
        await attendanceModel.insertIn(employee.id, date, time, late);
        await notificationModel.insert(`${employee.name} timed in at ${time}`);
        return { ...base, action: 'in', late };
    }

    if (!open) throw new AppError(`${employee.name} hasn't timed in today.`);
    const [h1, m1] = open.time_in.split(':').map(Number), [h2, m2] = time.split(':').map(Number);
    const hours = Math.max(0, (h2 * 60 + m2 - h1 * 60 - m1) / 60);
    await attendanceModel.updateOut(open.id, time, hours.toFixed(2));
    await notificationModel.insert(`${employee.name} timed out at ${time}`);
    return { ...base, action: 'out', hours: Number(hours.toFixed(2)) };
};
