import pool from '../config/db.js';

export const fetchAll = async () => {
    const [rows] = await pool.query(
        `SELECT a.id, e.emp_code, e.name, e.position, a.date, a.time_in, a.time_out, a.total_hours, a.is_late
         FROM attendance a JOIN employees e ON e.id = a.employee_id ORDER BY a.id DESC`
    );
    return rows;
};

export const findOpen = async (employeeId, date) => {
    const [rows] = await pool.query(
        "SELECT * FROM attendance WHERE employee_id = ? AND date = ? AND time_out IS NULL",
        [employeeId, date]
    );
    return rows[0];
};

export const insertIn = async (employeeId, date, time, late) => {
    const [result] = await pool.query(
        "INSERT INTO attendance(employee_id, date, time_in, is_late) VALUES (?, ?, ?, ?)",
        [employeeId, date, time, late ? 1 : 0]
    );
    return result.insertId;
};

export const updateOut = async (id, time, hours) => {
    const [result] = await pool.query(
        "UPDATE attendance SET time_out = ?, total_hours = ? WHERE id = ?",
        [time, hours, id]
    );
    return result.affectedRows;
};

// how many different employees came in on each day
export const presentCounts = async (from, to) => {
    const [rows] = await pool.query(
        "SELECT date, COUNT(DISTINCT employee_id) AS total FROM attendance WHERE date BETWEEN ? AND ? GROUP BY date",
        [from, to]
    );
    return rows;
};

// finished days (with time out) of one month, used by the payroll
export const completedInMonth = async (month) => {
    const [rows] = await pool.query(
        "SELECT employee_id, total_hours FROM attendance WHERE DATE_FORMAT(date, '%Y-%m') = ? AND time_out IS NOT NULL",
        [month]
    );
    return rows;
};
