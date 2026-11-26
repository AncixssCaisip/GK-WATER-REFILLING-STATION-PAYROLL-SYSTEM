// DATABASE CONNECTION: connects to MySQL running in XAMPP
import mysql from 'mysql2/promise'

const db = await mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',        // XAMPP default is empty password
  database: process.env.DB_NAME     || 'gkrefillingdb',
  waitForConnections: true,
  connectionLimit:    10,
})

export default db
