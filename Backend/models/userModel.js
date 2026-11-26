import pool from '../config/db.js';

// the owner (admin) account
export const findOwner = async () => {
    const [rows] = await pool.query("SELECT id, name, username, password_hash FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
    return rows[0];
};

export const findByUsername = async (username) => {
    const [rows] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
    return rows[0];
};

// db can be a transaction connection (used when an employee and the account are saved together)
export const insert = async (user, db = pool) => {
    const [result] = await db.query(
        "INSERT INTO users(name, username, password_hash, role, employee_id) VALUES (?, ?, ?, ?, ?)",
        [user.name, user.username, user.password_hash, user.role || 'admin', user.employee_id || null]
    );
    return result.insertId;
};

export const update = async (user) => {
    const [result] = await pool.query(
        "UPDATE users SET name = ?, username = ?, password_hash = ? WHERE id = ?",
        [user.name, user.username, user.password_hash, user.id]
    );
    return result.affectedRows;
};

export const updatePasswordByEmployee = async (employeeId, passwordHash) => {
    const [result] = await pool.query("UPDATE users SET password_hash = ? WHERE employee_id = ?", [passwordHash, employeeId]);
    return result.affectedRows;
};
