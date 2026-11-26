import * as attendanceController from '../controllers/attendanceController.js';
import express from "express";
import pool from '../config/db.js';
import { sendError, AppError } from '../utils/appError.js';

const attendanceRoutes = express.Router();

attendanceRoutes.get('/', attendanceController.fetchAllAttendance);
attendanceRoutes.post('/punch', attendanceController.punch);

// PUT /api/attendance/:id — admin corrects an attendance record
attendanceRoutes.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { time_in, time_out } = req.body

        if (!time_in) throw new AppError('Time in is required.')

        // Recalculate total hours if time_out is provided
        let total_hours = null
        let is_late = 0

        if (time_out) {
            const [h1, m1] = time_in.split(':').map(Number)
            const [h2, m2] = time_out.split(':').map(Number)
            total_hours = Math.max(0, (h2 * 60 + m2 - h1 * 60 - m1) / 60).toFixed(2)
        }

        // Check lateness against settings
        const [settings] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'start_time'")
        const start_time = settings[0]?.setting_value || '08:00'
        is_late = time_in > start_time ? 1 : 0

        await pool.query(
            'UPDATE attendance SET time_in = ?, time_out = ?, total_hours = ?, is_late = ? WHERE id = ?',
            [time_in, time_out || null, total_hours, is_late, id]
        )

        const [rows] = await pool.query(
            `SELECT a.id, e.emp_code, e.name, e.position, a.date, a.time_in, a.time_out, a.total_hours, a.is_late
             FROM attendance a JOIN employees e ON e.id = a.employee_id WHERE a.id = ?`,
            [id]
        )
        res.json(rows[0])
    } catch (e) { sendError(res, e) }
})

export default attendanceRoutes;
