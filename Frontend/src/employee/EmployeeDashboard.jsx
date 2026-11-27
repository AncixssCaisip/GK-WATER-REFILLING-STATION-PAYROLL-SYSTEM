import { useEffect, useRef, useState } from 'react'
import './EmployeeDashboard.css'
import BrandLogo from '../components/BrandLogo.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

// ── API helper ────────────────────────────────────────────────────────────────
async function empApi(path, method = 'GET', body, empCode) {
  const sep = path.includes('?') ? '&' : '?'
  const url = `/api/employees${path}${empCode ? `${sep}username=${empCode}` : ''}`
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => { throw new Error('Cannot connect to the server.') })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Something went wrong.')
  return data
}

function fmt12(val) {
  if (!val) return '—'
  const [h, m] = String(val).split(':').map(Number)
  const d = new Date(); d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
}

function fmtDate(val) {
  if (!val) return '—'
  return new Date(`${String(val).slice(0, 10)}T00:00`).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12L12 3l9 9M5 10v10h5v-6h4v6h5V10" />
  </svg>
)
const IconAtt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
  </svg>
)
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)
const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
)
const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
)
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)
const IconAbsent = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 14l6 6M15 14l-6 6" />
  </svg>
)
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)
const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)
const IconCamera = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

// ── Main Component ────────────────────────────────────────────────────────────
function EmployeeDashboard({ user, onLogout }) {
  const empCode = (user?.username || '').toLowerCase()

  const [page, setPage]       = useState('dashboard')
  const [employee, setEmployee] = useState(null)
  const [records, setRecords]  = useState([])
  const [notice, setNotice]    = useState({ text: '', type: '' })
  const [modal, setModal]      = useState(null) // 'edit' | 'password' | null

  // Edit profile form
  const [editForm, setEditForm]   = useState({ name: '', phone: '', address: '' })
  const [editErr, setEditErr]     = useState('')

  // Change password form
  const [pwForm, setPwForm]       = useState({ current: '', next: '', confirm: '' })
  const [pwErr, setPwErr]         = useState('')

  // Photo
  const photoRef = useRef(null)

  async function loadData() {
    try {
      const [profile, att] = await Promise.all([
        empApi('/profile', 'GET', undefined, empCode),
        empApi('/attendance', 'GET', undefined, empCode),
      ])
      setEmployee(profile)
      setEditForm({ name: profile.name, phone: profile.phone || '', address: profile.address || '' })
      setRecords(att)
    } catch (e) {
      setNotice({ text: e.message, type: 'error' })
    }
  }

  useEffect(() => { loadData() }, [])

  // ── Derived attendance stats ────────────────────────────────────────────────
  const daysPresent = records.filter((r) => r.timeIn).length
  const daysAbsent  = 0 // would need total working days from settings
  const lateCount   = records.filter((r) => String(r.status).toLowerCase() === 'late').length
  const undertime   = records.filter((r) => r.timeOut && Number(r.totalHours) < 8).length

  const today       = new Date().toISOString().slice(0, 10)
  const todayRecord = records.find((r) => String(r.date).slice(0, 10) === today)

  const todayDate = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

  // ── Save profile ────────────────────────────────────────────────────────────
  async function saveProfile(e) {
    e.preventDefault()
    setEditErr('')
    if (editForm.phone && editForm.phone.replace(/\D/g, '').length !== 11) {
      return setEditErr('Contact number must be exactly 11 digits.')
    }
    try {
      await empApi('/profile', 'PUT', editForm, empCode)
      setNotice({ text: 'Profile updated successfully.', type: 'success' })
      setModal(null)
      await loadData()
    } catch (err) { setEditErr(err.message) }
  }

  //── Change password ───────────────────────────────────────────────────────
  async function changePassword(e) {
    e.preventDefault()
    setPwErr('')
    if (pwForm.next.length < 8) return setPwErr('New password must be at least 8 characters.')
    if (pwForm.next !== pwForm.confirm) return setPwErr('Passwords do not match.')
    try {
      await empApi('/password', 'PUT', { current: pwForm.current, next: pwForm.next }, empCode)
      setNotice({ text: 'Password changed successfully.', type: 'success' })
      setModal(null)
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err) { setPwErr(err.message) }
  }

  // ── Change photo ────────────────────────────────────────────────────────────
  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setEmployee((prev) => ({ ...prev, photo: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  function nav(key) { setNotice({ text: '', type: '' }); setPage(key) }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="emp-app">

      {/* ── Top Header ── */}
      <header className="emp-header">
        <div className="emp-header-brand">
          <BrandLogo />
        </div>

        <div className="emp-header-user">
          <IconUser />
          <div>
            <div>Name: <strong>{employee?.name || user?.name || 'Employee'}</strong></div>
            <small>{employee?.employeeCode || empCode}</small>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="emp-body">

        {/* ── Sidebar ── */}
        <aside className="emp-sidebar">
          <button className={`emp-nav-btn${page === 'dashboard' ? ' active' : ''}`} onClick={() => nav('dashboard')}>
            <IconHome /><span>Dashboard</span>
          </button>
          <button className={`emp-nav-btn${page === 'attendance' ? ' active' : ''}`} onClick={() => nav('attendance')}>
            <IconAtt /><span>Attendance</span>
          </button>
          <button className={`emp-nav-btn${page === 'profile' ? ' active' : ''}`} onClick={() => nav('profile')}>
            <IconUser /><span>Profile</span>
          </button>

          <button className="emp-logout-btn" onClick={onLogout}>
            <IconLogout /><span>Log Out</span>
          </button>
        </aside>

        {/* ── Content ── */}
        <div className="emp-content">

          {/* Notice */}
          {notice.text && (
            <div className={`emp-notice ${notice.type}`}>
              {notice.text}
              <button onClick={() => setNotice({ text: '', type: '' })}>×</button>
            </div>
          )}

          {/* ══ DASHBOARD PAGE ══════════════════════════════════════════════ */}
          {page === 'dashboard' && (
            <>
              <div className="emp-welcome-box">
                <h2>Welcome, {employee?.name?.split(' ')[0] || 'Employee'}!</h2>
                <p>Here's your attendance for today!</p>
              </div>

              <div className="emp-time-cards">
                <div className="emp-time-card">
                  <IconClock />
                  <div>
                    <div className="label">Time In</div>
                    <div className="time">{fmt12(todayRecord?.timeIn)}</div>
                    <div className="date">{todayRecord ? todayDate : '—'}</div>
                  </div>
                </div>
                <div className="emp-time-card">
                  <IconClock />
                  <div>
                    <div className="label">Time Out</div>
                    <div className="time">{fmt12(todayRecord?.timeOut)}</div>
                    <div className="date">{todayRecord?.timeOut ? todayDate : '—'}</div>
                  </div>
                </div>
              </div>

              <div className="emp-table-card">
                <table className="emp-table">
                  <thead>
                    <tr><th>Date</th><th>Time In</th><th>Time Out</th><th>Total Hours</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {records.length
                      ? records.slice(0, 5).map((r) => (
                          <tr key={r.id}>
                            <td>{fmtDate(r.date)}</td>
                            <td>{fmt12(r.timeIn)}</td>
                            <td>{fmt12(r.timeOut)}</td>
                            <td>{r.totalHours ? `${Number(r.totalHours).toFixed(2)} hrs` : '—'}</td>
                            <td>
                              <span className={`emp-status-pill ${String(r.status).toLowerCase().replace(' ', '-')}`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      : <tr><td colSpan="5" className="emp-empty">No attendance records yet.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ══ ATTENDANCE PAGE ══════════════════════════════════════════════ */}
          {page === 'attendance' && (
            <>
              <div className="emp-att-title">Attendance!</div>

              <div className="emp-att-stats">
                <div className="emp-att-stat">
                  <IconCalendar />
                  <div><div className="num">{daysPresent}</div><div className="lbl">Days Present</div></div>
                </div>
                <div className="emp-att-stat">
                  <IconAbsent />
                  <div><div className="num">{daysAbsent}</div><div className="lbl">Days Absent</div></div>
                </div>
                <div className="emp-att-stat">
                  <IconClock />
                  <div><div className="num">{lateCount}</div><div className="lbl">Late</div></div>
                </div>
                <div className="emp-att-stat">
                  <IconClock />
                  <div><div className="num">{undertime}</div><div className="lbl">Undertime</div></div>
                </div>
              </div>

              <div className="emp-table-card">
                <table className="emp-table">
                  <thead>
                    <tr><th>Date</th><th>Time In</th><th>Time Out</th><th>Total Hours</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {records.length
                      ? records.map((r) => (
                          <tr key={r.id}>
                            <td>{fmtDate(r.date)}</td>
                            <td>{fmt12(r.timeIn)}</td>
                            <td>{fmt12(r.timeOut)}</td>
                            <td>{r.totalHours ? `${Number(r.totalHours).toFixed(2)} hrs` : '—'}</td>
                            <td>
                              <span className={`emp-status-pill ${String(r.status).toLowerCase().replace(' ', '-')}`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      : <tr><td colSpan="5" className="emp-empty">No attendance records yet.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ══ PROFILE PAGE ═════════════════════════════════════════════════ */}
          {page === 'profile' && (
            <div className="emp-profile-grid">

              {/* Left column */}
              <div className="emp-profile-left">
                {/* Photo card */}
                <div className="emp-profile-photo-card">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 16, fontWeight: 800, color: '#0f3f7c' }}>
                    <span style={{width:20,height:20,display:'inline-flex'}}><IconUser /></span> My Profile
                  </h3>
                  <div className="emp-photo-circle">
                    {employee?.photo
                      ? <img src={employee.photo} alt="Profile" />
                      : <IconUser />
                    }
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                  <button className="emp-change-photo-btn" onClick={() => photoRef.current?.click()}>
                    <IconCamera /> change photo
                  </button>
                </div>

                {/* Account details */}
                <div className="emp-account-card">
                  <h3><IconShield /> Account Details</h3>
                  <div className="emp-account-row"><span className="key">Username</span><span className="value">: {employee?.username || '—'}</span></div>
                  <div className="emp-account-row"><span className="key">Role</span><span className="value">: Employee</span></div>
                  <div className="emp-account-row"><span className="key">Status</span><span className="value">: {employee?.status || '—'}</span></div>
                </div>
              </div>

              {/* Right column */}
              <div className="emp-profile-right">
                {/* Personal info */}
                <div className="emp-info-card">
                  <h3><span style={{width:18,height:18,display:'inline-flex'}}><IconUser /></span> Personal Info.</h3>
                  <div className="emp-info-row"><div className="key">Fullname:</div><div className="value">{employee?.name || '—'}</div></div>
                  <div className="emp-info-row"><div className="key">Employee ID:</div><div className="value">{employee?.employeeCode || '—'}</div></div>
                  <div className="emp-info-row"><div className="key">Position:</div><div className="value">{employee?.position || '—'}</div></div>
                  <div className="emp-info-row"><div className="key">Email:</div><div className="value">{employee?.email || '—'}</div></div>
                  <div className="emp-info-row"><div className="key">Contact No.:</div><div className="value">{employee?.phone || '—'}</div></div>
                </div>

                {/* Action buttons */}
                <div className="emp-action-btns">
                  <button className="emp-action-btn edit" onClick={() => { setEditErr(''); setModal('edit') }}>
                    <IconEdit /> Edit Profile
                  </button>
                  <button className="emp-action-btn pw" onClick={() => { setPwErr(''); setModal('password') }}>
                    <IconLock /> Change Password
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      {modal === 'edit' && (
        <div className="emp-modal-bg">
          <div className="emp-modal">
            <h3>Edit Profile</h3>
            <form onSubmit={saveProfile}>
              <label>Full Name</label>
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              <label>Contact Number</label>
              <input
                value={editForm.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 11)
                  setEditForm({ ...editForm, phone: val })
                }}
                placeholder="09XXXXXXXXX"
                maxLength={11}
              />
              <label>Address</label>
              <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              {editErr && <p className="emp-modal-err">{editErr}</p>}
              <div className="emp-modal-row">
                <button type="button" className="emp-modal-btn ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="emp-modal-btn primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {modal === 'password' && (
        <div className="emp-modal-bg">
          <div className="emp-modal">
            <h3>Change Password</h3>
            <form onSubmit={changePassword}>
              <label>Current Password</label>
              <input type="password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} required />
              <label>New Password (min. 8 characters)</label>
              <input type="password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} required />
              <label>Confirm New Password</label>
              <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required />
              {pwErr && <p className="emp-modal-err">{pwErr}</p>}
              <div className="emp-modal-row">
                <button type="button" className="emp-modal-btn ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="emp-modal-btn primary">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default EmployeeDashboard
