import { useState } from 'react'
import './AuthPage.css'
import PasswordInput from '../components/PasswordInput.jsx'

const ROLES = [
  { value: 'customer', label: 'Customer' },
  { value: 'employee', label: 'Employee' },
  { value: 'driver',   label: 'Driver' },
  { value: 'admin',    label: 'Admin / Owner' },
]

function LoginPage({ onLogin, onGoRegister }) {
  const [form, setForm]   = useState({ username: '', password: '', role: 'customer' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Login failed.')
      onLogin(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <svg viewBox="0 0 46 60" aria-hidden="true" width="38" height="52">
            <path d="M23 2C23 2 3 26 3 39a20 20 0 0 0 40 0C43 26 23 2 23 2z" fill="#29a9e1" />
          </svg>
          <div>
            <span className="auth-brand-gk">GK</span>
            <span className="auth-brand-rs">Refilling Station</span>
          </div>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-sub">Sign in to your account</p>

        <form onSubmit={submit}>
          <label htmlFor="role">Log in as</label>
          <select id="role" value={form.role} onChange={set('role')}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>

          <label htmlFor="username">Username</label>
          <input id="username" type="text" placeholder="Enter your username"
            value={form.username} onChange={set('username')} autoComplete="username" required />

          <label htmlFor="password">Password</label>
          <PasswordInput id="password" value={form.password} onChange={set('password')}
            placeholder="Enter your password" autoComplete="current-password" required />

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {form.role === 'customer' && (
          <p className="auth-switch">
            Don&apos;t have an account?{' '}
            <button className="auth-link" onClick={onGoRegister}>Create account</button>
          </p>
        )}
      </div>
    </div>
  )
}

export default LoginPage
