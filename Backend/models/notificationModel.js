import pool from '../config/db.js';

export const insert = async (message) => {
    await pool.query("INSERT INTO notifications(message) VALUES (?)", [message]);
    // keep only the latest 30
    await pool.query("DELETE FROM notifications WHERE id NOT IN (SELECT id FROM (SELECT id FROM notifications ORDER BY id DESC LIMIT 30) AS latest)");
};

export const fetchRecent = async (limit) => {
    const [rows] = await pool.query("SELECT message, created_at FROM notifications ORDER BY id DESC LIMIT ?", [limit]);
    return rows;
};
