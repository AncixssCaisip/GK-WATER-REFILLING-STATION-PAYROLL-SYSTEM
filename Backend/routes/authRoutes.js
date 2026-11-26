import express from 'express'
import crypto from 'crypto'
import pool from '../config/db.js'
import db from '../db.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { sendOtpEmail, sendPasswordResetEmail } from '../utils/mailer.js'
import { AppError, sendError } from '../utils/appError.js'

const router = express.Router()

// ── helpers ──────────────────────────────────────────────────────────────────
function makeToken() {
  return crypto.randomBytes(32).toString('hex')
}

// 6-digit OTP
function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function saveOtp(email, type, minutes = 10) {
  const otp = makeOtp()
  await pool.query(
    'DELETE FROM verification_tokens WHERE email = ? AND type = ?',
    [email, type]
  )
  await pool.query(
    `INSERT INTO verification_tokens (email, token, type, expires_at)
     VALUES (?, ?, ?, NOW() + INTERVAL ? MINUTE)`,
    [email, otp, type, minutes]
  )
  return otp
}

async function saveToken(email, type, hours = 1) {
  const token = makeToken()
  await pool.query(
    'DELETE FROM verification_tokens WHERE email = ? AND type = ?',
    [email, type]
  )
  await pool.query(
    `INSERT INTO verification_tokens (email, token, type, expires_at)
     VALUES (?, ?, ?, NOW() + INTERVAL ? HOUR)`,
    [email, token, type, hours]
  )
  return token
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
// Customer self-registration — sends a 6-digit OTP to their email
router.post('/register', async (req, res) => {
  try {
    const name     = (req.body.name     || '').trim()
    const username = (req.body.username || '').trim().toLowerCase()
    const email    = (req.body.email    || '').trim().toLowerCase()
    const phone    = (req.body.phone    || '').trim()
    const address  = (req.body.address  || '').trim()
    const password = req.body.password  || ''

    if (!name || !username || !email || !phone || !address || !password)
      throw new AppError('All fields are required.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new AppError('Enter a valid email address.')
    if (password.length < 8)
      throw new AppError('Password must be at least 8 characters.')

    // Check duplicates
    const [existEmail]    = await db.query('SELECT id FROM customers WHERE email = ?',    [email])
    const [existUsername] = await db.query('SELECT id FROM customers WHERE username = ?', [username])
    if (existEmail.length)    throw new AppError('That email is already registered.')
    if (existUsername.length) throw new AppError('That username is already taken.')

    // Insert customer (email_verified = 0 until OTP is confirmed)
    const today = new Date().toISOString().slice(0, 10)
    await db.query(
      `INSERT INTO customers (name, username, email, phone, address, password, status, since, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, 'Active', ?, 0)`,
      [name, username, email, phone, address, hashPassword(password), today]
    )

    // Generate and send 6-digit OTP (expires in 10 minutes)
    const otp = await saveOtp(email, 'register', 10)
    await sendOtpEmail(email, otp)
    res.json({ message: 'OTP sent! Check your email.', email })
  } catch (e) { sendError(res, e) }
})

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
// Customer submits the 6-digit OTP from their email
router.post('/verify-otp', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase()
    const otp   = (req.body.otp   || '').trim()

    if (!email || !otp) throw new AppError('Email and OTP are required.')

    const [rows] = await pool.query(
      `SELECT * FROM verification_tokens
       WHERE email = ? AND token = ? AND type = 'register' AND expires_at > NOW()`,
      [email, otp]
    )

    if (!rows.length) throw new AppError('Invalid or expired OTP. Request a new one.')

    await db.query('UPDATE customers SET email_verified = 1 WHERE email = ?', [email])
    await pool.query('DELETE FROM verification_tokens WHERE email = ? AND type = ?', [email, 'register'])

    res.json({ message: 'Email verified! You can now log in.' })
  } catch (e) { sendError(res, e) }
})

// ── POST /api/auth/resend-otp ─────────────────────────────────────────────────
// Resend a new OTP to the customer's email
router.post('/resend-otp', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase()
    if (!email) throw new AppError('Email is required.')

    const [rows] = await db.query(
      'SELECT id FROM customers WHERE email = ? AND email_verified = 0', [email]
    )
    if (!rows.length) throw new AppError('No unverified account found for that email.')

    const otp = await saveOtp(email, 'register', 10)
    await sendOtpEmail(email, otp)
    res.json({ message: 'A new OTP has been sent to your email.' })
  } catch (e) { sendError(res, e) }
})

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const username = (req.body.username || '').trim().toLowerCase()
    const password = req.body.password  || ''
    const role     = req.body.role      || ''

    if (!username || !password || !role)
      throw new AppError('Username, password, and role are required.')

    // ── Customer login ──
    if (role === 'customer') {
      const [rows] = await db.query(
        'SELECT * FROM customers WHERE username = ?', [username]
      )
      const customer = rows[0]
      if (!customer || !verifyPassword(password, customer.password))
        throw new AppError('Incorrect username or password.')
      if (!customer.email_verified)
        throw new AppError('Please verify your email before logging in. Check your inbox.')
      if (customer.status !== 'Active')
        throw new AppError('Your account is inactive. Contact the station.')

      return res.json({
        role: 'customer',
        id: customer.id,
        name: customer.name,
        username: customer.username,
      })
    }

    // ── Admin / Employee / Driver login ──
    if (role === 'admin' || role === 'employee' || role === 'driver') {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE username = ?', [username]
      )
      const user = rows[0]
      if (!user || !verifyPassword(password, user.password_hash))
        throw new AppError('Incorrect username or password.')
      if (user.role !== role)
        throw new AppError(`This account is not a ${role} account.`)

      return res.json({
        role:        user.role,
        id:          user.id,
        name:        user.name,
        username:    user.username,
        employee_id: user.employee_id || null,
        driver_id:   user.driver_id   || null,
      })
    }

    throw new AppError('Invalid role selected.')
  } catch (e) { sendError(res, e) }
})

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase()
    if (!email) throw new AppError('Enter your email address.')

    // Check in customers
    const [customers] = await db.query('SELECT * FROM customers WHERE email = ?', [email])
    if (customers.length) {
      const token = await saveToken(email, 'reset', 1)
      try { await sendPasswordResetEmail(email, token) } catch { console.log(`\n📧 Reset token for ${email}: ${token}\n`) }
      return res.json({ message: 'Password reset link sent to your email.' })
    }

    // Check in users (admin/employee)
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
    if (users.length) {
      const token = await saveToken(email, 'reset', 1)
      try { await sendPasswordResetEmail(email, token) } catch { console.log(`\n📧 Reset token for ${email}: ${token}\n`) }
      return res.json({ message: 'Password reset link sent to your email.' })
    }

    // Don't reveal if email exists or not
    res.json({ message: 'If that email is registered, a reset link has been sent.' })
  } catch (e) { sendError(res, e) }
})

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body
    if (!token || !password) throw new AppError('Token and new password are required.')
    if (password.length < 8) throw new AppError('Password must be at least 8 characters.')

    const [rows] = await pool.query(
      `SELECT * FROM verification_tokens WHERE token = ? AND type = 'reset' AND expires_at > NOW()`,
      [token]
    )
    if (!rows.length) throw new AppError('Reset link has expired. Please request a new one.')

    const { email } = rows[0]
    const hashed = hashPassword(password)

    // Try customers first, then users
    const [cust] = await db.query('SELECT id FROM customers WHERE email = ?', [email])
    if (cust.length) {
      await db.query('UPDATE customers SET password = ? WHERE email = ?', [hashed, email])
    } else {
      await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [hashed, email])
    }

    await pool.query('DELETE FROM verification_tokens WHERE token = ?', [token])
    res.json({ message: 'Password reset successfully. You can now log in.' })
  } catch (e) { sendError(res, e) }
})

export default router
