import { useState } from 'react'
import './AuthPage.css'
import PasswordInput from '../components/PasswordInput.jsx'

const blank = { name: '', username: '', email: '', phone: '', address: '', password: '', confirm: '' }

function RegisterPage({ onGoLogin, onRegistered }) {
  const [form, setForm]     = useState(blank)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirm) {
      return setError('Passwords do not match.')
    }

    setLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Registration failed.')
      onRegistered(form.email, data.otp || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card auth-card-wide">
        <div className="auth-logo">
          <svg viewBox="0 0 46 60" aria-hidden="true" width="38" height="52">
            <path d="M23 2C23 2 3 26 3 39a20 20 0 0 0 40 0C43 26 23 2 23 2z" fill="#29a9e1" />
          </svg>
          <div>
            <span className="auth-brand-gk">GK</span>
            <span className="auth-brand-rs">Refilling Station</span>
          </div>
        </div>

        <h2 className="auth-title">Create account</h2>
        <p className="auth-sub">Register as a customer</p>

        {success ? (
          <div className="auth-success">
            <p>{success}</p>
            <button className="auth-btn" onClick={onGoLogin}>Go to login</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="auth-row">
              <div>
                <label htmlFor="name">Full name</label>
                <input id="name" type="text" placeholder="Juan Dela Cruz"
                  value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <label htmlFor="username">Username</label>
                <input id="username" type="text" placeholder="juandelacruz"
                  value={form.username} onChange={set('username')} required />
              </div>
            </div>

            <label htmlFor="email">Email address</label>
            <input id="email" type="email" placeholder="juan@email.com"
              value={form.email} onChange={set('email')} required />

            <div className="auth-row">
              <div>
                <label htmlFor="phone">Phone number</label>
                <input id="phone" type="text" placeholder="09XXXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  maxLength={11} pattern="\d{11}" title="Enter an 11-digit phone number" required />
              </div>
              <div>
                <label htmlFor="address">Address</label>
                <input id="address" type="text" placeholder="Brgy. 3, Balayan, Batangas"
                  value={form.address} onChange={set('address')} required />
              </div>
            </div>

            <div className="auth-row">
              <div>
                <label htmlFor="password">Password</label>
                <PasswordInput id="password" value={form.password} onChange={set('password')}
                  placeholder="At least 8 characters" required />
              </div>
              <div>
                <label htmlFor="confirm">Confirm password</label>
                <PasswordInput id="confirm" value={form.confirm} onChange={set('confirm')}
                  placeholder="Repeat your password" required />
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Already have an account?{' '}
          <button className="auth-link" onClick={onGoLogin}>Sign in</button>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
