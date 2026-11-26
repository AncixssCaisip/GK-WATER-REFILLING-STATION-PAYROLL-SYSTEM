// MODEL: customer data — reads and writes to MySQL
import db from '../db.js'

const CUSTOMER_ID = 1 // single-customer system

export async function getCustomer() {
  const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [CUSTOMER_ID])
  return rows[0]
}

export async function updateInfo({ name, phone, address }) {
  await db.query(
    'UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?',
    [name, phone, address, CUSTOMER_ID]
  )
  return getCustomer()
}

export async function updatePhoto(photo) {
  await db.query('UPDATE customers SET photo = ? WHERE id = ?', [photo, CUSTOMER_ID])
  return getCustomer()
}

export async function updatePassword(password) {
  await db.query('UPDATE customers SET password = ? WHERE id = ?', [password, CUSTOMER_ID])
}
