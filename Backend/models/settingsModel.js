import pool from '../config/db.js';

export const fetchAll = async () => {
    const [rows] = await pool.query("SELECT setting_key, setting_value FROM settings");
    return Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
};

export const save = async (key, value) => {
    await pool.query(
        "INSERT INTO settings(setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
        [key, String(value)]
    );
};
