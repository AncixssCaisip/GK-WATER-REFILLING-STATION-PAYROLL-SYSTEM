// MODEL: orders — reads and writes to MySQL
import db from '../db.js'

export async function getOrders(customerName) {
  if (customerName) {
    const [rows] = await db.query(
      'SELECT * FROM orders WHERE customer_name = ? ORDER BY id DESC',
      [customerName]
    )
    return rows
  }
  const [rows] = await db.query('SELECT * FROM orders ORDER BY id DESC')
  return rows
}

export async function addOrder({ driver, driver_id, pickup, delivery, landmark, qty, customer_name }) {
  const date = new Date().toISOString().slice(0, 10)
  const [result] = await db.query(
    `INSERT INTO orders (date, driver, driver_id, pickup, delivery, landmark, qty, amount, status, customer_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'Pending', ?)`,
    [date, driver, driver_id || null, pickup, delivery, landmark ?? '', qty, customer_name || null]
  )
  const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [result.insertId])
  return rows[0]
}
