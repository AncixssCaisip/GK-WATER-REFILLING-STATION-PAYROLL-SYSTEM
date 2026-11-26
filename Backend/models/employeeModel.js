import pool from '../config/db.js';
import * as userModel from './userModel.js';

const SELECT = `SELECT e.id, e.emp_code, e.name, e.position, e.basic_salary, e.allowance, e.commission, e.status, u.username, u.role
                 FROM employees e LEFT JOIN users u ON u.employee_id = e.id`;

export const fetch = async () => {
    const [rows] = await pool.query(`${SELECT} ORDER BY e.id`);
    return rows;
};

export const findById = async (id) => {
    const [rows] = await pool.query(`${SELECT} WHERE e.id = ?`, [id]);
    return rows[0];
};

export const findByCode = async (code) => {
    const [rows] = await pool.query(`${SELECT} WHERE e.emp_code = ?`, [code]);
    return rows[0];
};

// saves the employee, the ID used by the QR code (GK-001...) and the login account together
export const insert = async (e, account) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [result] = await conn.query(
            "INSERT INTO employees(name, position, basic_salary, allowance, commission, status) VALUES (?, ?, ?, ?, ?, ?)",
            [e.name, e.position, e.basic_salary, e.allowance, e.commission, e.status]
        );
        await conn.query("UPDATE employees SET emp_code = CONCAT('GK-', LPAD(id, 3, '0')) WHERE id = ?", [result.insertId]);
        await userModel.insert({ name: e.name, username: account.username, password_hash: account.password_hash, role: account.role || 'employee', employee_id: result.insertId }, conn);
        await conn.commit();
        return result.insertId;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

export const update = async (e) => {
    const [result] = await pool.query(
        "UPDATE employees SET name = ?, position = ?, basic_salary = ?, allowance = ?, commission = ?, status = ? WHERE id = ?",
        [e.name, e.position, e.basic_salary, e.allowance, e.commission, e.status, e.id]
    );
    await pool.query("UPDATE users SET name = ? WHERE employee_id = ?", [e.name, e.id]);
    return result.affectedRows;
};

// the account is removed automatically (ON DELETE CASCADE)
export const remove = async (id) => {
    const [result] = await pool.query("DELETE FROM employees WHERE id = ?", [id]);
    return result.affectedRows;
};
