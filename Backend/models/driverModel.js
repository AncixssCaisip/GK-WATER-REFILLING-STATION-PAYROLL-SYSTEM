// MODEL: drivers — reads from MySQL drivers table
import pool from '../config/db.js'

export async function getAvailableDrivers() {
  const [rows] = await pool.query(
    "SELECT id, name, status FROM drivers WHERE status = 'Available' ORDER BY name"
  )
  return rows
}

export async function findDriver(id) {
  const [rows] = await pool.query('SELECT * FROM drivers WHERE id = ?', [Number(id)])
  return rows[0]
}
