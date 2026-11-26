import { useEffect, useRef, useState } from 'react'
import './AuthPage.css'

function OtpPage({ email, onVerified, onGoLogin, initialOtp }) {
  const [otp, setOtp]       = useState(['', '', '', '', '', ''])
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [timer, setTimer]   = useState(600)
  const [shownOtp, setShownOtp] = useState(initialOtp || null)
  const inputs = useRef([])

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return
    const id = setInterval(() => setTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [timer])

  const minutes = String(Math.floor(timer / 60)).padStart(2, '0')
  const seconds = String(timer % 60).padStart(2, '0')
  const expired = timer <= 0

  function handleChange(index, value) {
    if (!/^\d*$/.test(value)) return // digits only
    const next = [...otp]
    next[index] = value.slice(-1) // one digit per box
    setOtp(next)
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      inputs.current[5]?.focus()
    }
  }

  async function submit(e) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) return setError('Enter all 6 digits.')
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, otp: code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Verification failed.')
      setSuccess(data.message)
    } catch (err) {
      setError(err.message)
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    setResending(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/resend-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setTimer(600)
      setOtp(['', '', '', '', '', ''])
      if (data.otp) setShownOtp(data.otp)
      inputs.current[0]?.focus()
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
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

        <h2 className="auth-title">Verify your email</h2>
        <p className="auth-sub">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>

        {success ? (
          <div className="auth-success">
            <p>{success}</p>
            <button className="auth-btn" onClick={onVerified}>Go to login</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="otp-boxes" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputs.current[i] = el)}
                  className="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {!expired && (
              <p className="otp-timer">
                Code expires in <strong>{minutes}:{seconds}</strong>
              </p>
            )}
            {expired && (
              <p className="otp-timer otp-expired">Code has expired.</p>
            )}

            {error && <p className="auth-error">{error}</p>}

            <button className="auth-btn" type="submit" disabled={loading || expired}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              className="auth-btn"
              style={{ background: '#6b83a3', marginTop: 10 }}
              onClick={resend}
              disabled={resending || (!expired && timer > 540)}
            >
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Wrong email?{' '}
          <button className="auth-link" onClick={onGoLogin}>Back to login</button>
        </p>
      </div>
    </div>
  )
}

export default OtpPage
