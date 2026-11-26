import nodemailer from 'nodemailer'

// ─── Configure your Gmail credentials here ───────────────────────────────────
// 1. Create a Gmail account for GK Water Refilling Station
// 2. Enable 2-Step Verification on that Google account
// 3. Go to Google Account → Security → App Passwords → create one
// 4. Replace the values below with your actual email and App Password
const GMAIL_USER = process.env.GMAIL_USER || 'kennesaur@gmail.com'
const GMAIL_PASS = process.env.GMAIL_PASS || 'cuhuczomrfizfboy'
// ─────────────────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  tls: { rejectUnauthorized: false },
})

// Send a 6-digit OTP for email verification on registration
export async function sendOtpEmail(toEmail, otp) {
  await transporter.sendMail({
    from: `"GK Water Refilling Station" <${GMAIL_USER}>`,
    to: toEmail,
    subject: 'Your GK Water Refilling verification code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1170be">GK Water Refilling Station</h2>
        <p>Thank you for registering! Use the code below to verify your email address.</p>
        <div style="font-size:40px;font-weight:bold;letter-spacing:12px;text-align:center;
                    background:#f0f8ff;border:2px solid #27a8e1;border-radius:12px;
                    padding:20px;color:#0f3f7c;margin:20px 0">
          ${otp}
        </div>
        <p style="color:#555">This code expires in <strong>10 minutes</strong>.</p>
        <p style="color:#888;font-size:13px">
          If you did not create an account at GK Water Refilling Station, ignore this email.
        </p>
      </div>
    `,
  })
}

// Send a password reset OTP
export async function sendPasswordResetEmail(toEmail, token) {
  const link = `http://localhost:5173/reset-password?token=${token}`
  await transporter.sendMail({
    from: `"GK Water Refilling Station" <${GMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset your GK Water Refilling password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1170be">GK Water Refilling Station</h2>
        <p>We received a request to reset your password. Click the button below to set a new one.</p>
        <a href="${link}" style="display:inline-block;background:#27a8e1;color:#fff;
                                  padding:12px 28px;border-radius:8px;text-decoration:none;
                                  font-weight:bold">
          Reset my password
        </a>
        <p style="color:#888;font-size:13px;margin-top:20px">
          This link expires in 1 hour. If you did not request this, ignore this email.
        </p>
      </div>
    `,
  })
}
