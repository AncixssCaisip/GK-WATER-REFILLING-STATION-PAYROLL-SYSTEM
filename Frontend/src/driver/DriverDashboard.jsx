import { useEffect, useRef, useState } from 'react'
import './DriverDashboard.css'
import BrandLogo from '../components/BrandLogo.jsx'

// ── API ───────────────────────────────────────────────────────────────────────
async function drvApi(path, method = 'GET', body, username) {
  const sep = path.includes('?') ? '&' : '?'
  const url = `/api/driver${path}${username ? `${sep}username=${username}` : ''}`
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
  return new Date(`${String(val).slice(0, 10)}T00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IHome   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12L12 3l9 9M5 10v10h5v-6h4v6h5V10"/></svg>
const IDeliv  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8zM5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>
const IUser   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
const ILogout = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
const IClock  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
const IShield = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IEdit   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const ILock   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const ICamera = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>

// ── Component ─────────────────────────────────────────────────────────────────
function DriverDashboard({ user, onLogout }) {
  const username = user?.username || ''

  const [page, setPage]         = useState('dashboard')
  const [driver, setDriver]     = useState(null)
  const [deliveries, setDeliveries] = useState([])
  const [attendance, setAttendance] = useState([])
  const [notice, setNotice]     = useState({ text: '', type: '' })
  const [driverStatus, setDriverStatus] = useState('Available')
  const [modal, setModal]       = useState(null) // 'edit' | 'password' | 'deliver'
  const [deliverOrder, setDeliverOrder] = useState(null)
  const [amount, setAmount]     = useState('')
  const [amountErr, setAmountErr] = useState('')
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', email: '' })
  const [editErr, setEditErr]   = useState('')
  const [pwForm, setPwForm]     = useState({ current: '', next: '', confirm: '' })
  const [pwErr, setPwErr]       = useState('')
  const photoRef = useRef(null)

  async function loadAll() {
    try {
      const [prof, del, att] = await Promise.all([
        drvApi('/profile', 'GET', undefined, username),
        drvApi('/deliveries', 'GET', undefined, username),
        drvApi('/attendance', 'GET', undefined, username),
      ])
      setDriver(prof)
      setDriverStatus(prof.status)
      setEditForm({ name: prof.name, phone: prof.phone || '', address: prof.address || '', email: prof.email || '' })
      setDeliveries(del)
      setAttendance(att)
    } catch (e) {
      setNotice({ text: e.message, type: 'error' })
    }
  }

  useEffect(() => { loadAll() }, [])

  // Today's attendance
  const today = new Date().toISOString().slice(0, 10)
  const todayRec = attendance.find((r) => String(r.date).slice(0, 10) === today)
  const todayDate = new Date().toLocaleDateString('en-PH', { month: 'numeric', day: 'numeric', year: 'numeric' })

  // Toggle status
  async function toggleStatus() {
    const next = driverStatus === 'Available' ? 'Unavailable' : 'Available'
    try {
      await drvApi('/status', 'PUT', { status: next }, username)
      setDriverStatus(next)
      setNotice({ text: `Status set to ${next}.`, type: 'success' })
    } catch (e) { setNotice({ text: e.message, type: 'error' }) }
  }

  // Mark as delivered
  async function markDelivered(e) {
    e.preventDefault()
    setAmountErr('')
    if (!amount || isNaN(amount) || Number(amount) <= 0) return setAmountErr('Enter a valid amount.')
    try {
      await drvApi(`/deliveries/${deliverOrder.id}/deliver`, 'PUT', { amount: Number(amount) }, username)
      setNotice({ text: 'Order marked as delivered.', type: 'success' })
      setModal(null)
      setAmount('')
      await loadAll()
    } catch (e) { setAmountErr(e.message) }
  }

  // Save profile
  async function saveProfile(e) {
    e.preventDefault()
    setEditErr('')
    if (editForm.phone && editForm.phone.replace(/\D/g, '').length !== 11) {
      return setEditErr('Contact number must be exactly 11 digits.')
    }
    try {
      await drvApi('/profile', 'PUT', editForm, username)
      setNotice({ text: 'Profile updated.', type: 'success' })
      setModal(null)
      await loadAll()
    } catch (e) { setEditErr(e.message) }
  }

  // Change password
  async function changePassword(e) {
    e.preventDefault()
    setPwErr('')
    if (pwForm.next.length < 8) return setPwErr('New password must be at least 8 characters.')
    if (pwForm.next !== pwForm.confirm) return setPwErr('Passwords do not match.')
    try {
      await drvApi('/password', 'PUT', { current: pwForm.current, next: pwForm.next }, username)
      setNotice({ text: 'Password changed.', type: 'success' })
      setModal(null)
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (e) { setPwErr(e.message) }
  }

  // Change photo
  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await drvApi('/photo', 'PUT', { photo: reader.result }, username)
        setDriver((prev) => ({ ...prev, photo: reader.result }))
        setNotice({ text: 'Photo updated.', type: 'success' })
      } catch (err) { setNotice({ text: err.message, type: 'error' }) }
    }
    reader.readAsDataURL(file)
  }

  function nav(key) { setNotice({ text: '', type: '' }); setPage(key) }

  return (
    <div className="drv-app">
      {/* Header */}
      <header className="drv-header">
        <div className="drv-brand">
          <BrandLogo />
        </div>
        <div className="drv-header-user">
          <IUser />
          <div>
            <div>Name: <strong>{driver?.name || user?.name || 'Driver'}</strong></div>
            <small>{driver?.empCode || username}</small>
          </div>
        </div>
      </header>

      <div className="drv-body">
        {/* Sidebar */}
        <aside className="drv-sidebar">
          <button className={`drv-nav${page === 'dashboard'   ? ' active' : ''}`} onClick={() => nav('dashboard')}><IHome /><span>Dashboard</span></button>
          <button className={`drv-nav${page === 'deliveries'  ? ' active' : ''}`} onClick={() => nav('deliveries')}><IDeliv /><span>My Deliveries</span></button>
          <button className={`drv-nav${page === 'profile'     ? ' active' : ''}`} onClick={() => nav('profile')}><IUser /><span>Profile</span></button>
          <button className="drv-logout" onClick={onLogout}><ILogout /><span>Log Out</span></button>
        </aside>

        {/* Content */}
        <div className="drv-content">
          {notice.text && (
            <div className={`drv-notice ${notice.type}`}>
              {notice.text}<button onClick={() => setNotice({ text: '', type: '' })}>×</button>
            </div>
          )}

          {/* ══ DASHBOARD ════════════════════════════════════════════════════ */}
          {page === 'dashboard' && (
            <>
              <div className="drv-welcome">
                <h2>Welcome, {driver?.name?.split(' ')[0] || 'Driver'}!</h2>
                <p>Here's your attendance for today!</p>
              </div>

              <div className="drv-time-cards">
                <div className="drv-time-card">
                  <IClock />
                  <div>
                    <div className="lbl">Time In</div>
                    <div className="val">{fmt12(todayRec?.timeIn)}</div>
                    <div className="dt">{todayRec ? todayDate : '—'}</div>
                  </div>
                </div>
                <div className="drv-time-card">
                  <IClock />
                  <div>
                    <div className="lbl">Time Out</div>
                    <div className="val">{fmt12(todayRec?.timeOut)}</div>
                    <div className="dt">{todayRec?.timeOut ? todayDate : '—'}</div>
                  </div>
                </div>
              </div>

              <div className="drv-table-card">
                <table className="drv-table">
                  <thead><tr><th>Date</th><th>Time In</th><th>Time Out</th><th>Total Hours</th><th>Status</th></tr></thead>
                  <tbody>
                    {attendance.length
                      ? attendance.slice(0, 5).map((r) => (
                          <tr key={r.id}>
                            <td>{fmtDate(r.date)}</td>
                            <td>{fmt12(r.timeIn)}</td>
                            <td>{fmt12(r.timeOut)}</td>
                            <td>{r.totalHours ? `${Number(r.totalHours).toFixed(2)} hrs` : 'Needing Time out'}</td>
                            <td><span className={`drv-pill ${String(r.status).toLowerCase().replace(' ', '-')}`}>{r.status}</span></td>
                          </tr>
                        ))
                      : <tr><td colSpan="5" className="drv-empty">No attendance records yet.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
              <p className="drv-hint">Time In and Time Out are recorded through the Admin GK attendance scanner.</p>
            </>
          )}

          {/* ══ DELIVERIES ═══════════════════════════════════════════════════ */}
          {page === 'deliveries' && (
            <>
              <div className="drv-status-bar">
                <span>Status:</span>
                <span className={`drv-status-pill ${driverStatus.toLowerCase()}`}>{driverStatus}</span>
                <button
                  className={`drv-toggle-btn${driverStatus !== 'Available' ? ' go-available' : ''}`}
                  onClick={toggleStatus}
                >
                  {driverStatus === 'Available' ? 'Stop taking orders' : 'Go available'}
                </button>
              </div>

              <div className="drv-table-card">
                <table className="drv-table">
                  <thead><tr><th>Date</th><th>Customer</th><th>Delivery</th><th>Landmark</th><th>Qty</th><th>Status</th><th>Mark as delivered</th></tr></thead>
                  <tbody>
                    {deliveries.length
                      ? deliveries.map((o) => (
                          <tr key={o.id}>
                            <td>{fmtDate(o.date)}</td>
                            <td>{o.customer_name || '—'}</td>
                            <td>{o.delivery}</td>
                            <td>{o.landmark || '—'}</td>
                            <td>{o.qty}</td>
                            <td><span className={`drv-pill ${String(o.status).toLowerCase().replace(' ', '-')}`}>{o.status}</span></td>
                            <td>
                              {o.status !== 'Delivered' && (
                                <button className="drv-deliver-btn" onClick={() => { setDeliverOrder(o); setAmount(''); setAmountErr(''); setModal('deliver') }}>
                                  Mark delivered
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      : <tr><td colSpan="7" className="drv-empty">No deliveries assigned yet.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
              <button className="drv-refresh-btn" onClick={loadAll}>↻ Refresh deliveries</button>
            </>
          )}

          {/* ══ PROFILE ══════════════════════════════════════════════════════ */}
          {page === 'profile' && (
            <div className="drv-profile-wrap">
              <div className="drv-profile-left">
                <div className="drv-photo-card">
                  <h3><IUser /> My Profile</h3>
                  <div className="drv-photo-circle">
                    {driver?.photo ? <img src={driver.photo} alt="Profile" /> : <IUser />}
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
                  <button className="drv-change-photo" onClick={() => photoRef.current?.click()}>
                    <ICamera /> Change photo
                  </button>
                </div>

                <div className="drv-acct-card">
                  <h3><IShield /> Account Details</h3>
                  <div className="drv-acct-row"><span className="k">Username</span><span className="v">: {driver?.username || '—'}</span></div>
                  <div className="drv-acct-row"><span className="k">Role</span><span className="v">: Driver</span></div>
                  <div className="drv-acct-row"><span className="k">Status</span><span className="v">: {driver?.status || '—'}</span></div>
                </div>
              </div>

              <div>
                <div className="drv-info-card">
                  <h3><IUser /> Personal Info.</h3>
                  <div className="drv-info-row"><div className="k">Fullname:</div><div className="v">{driver?.name || '—'}</div></div>
                  <div className="drv-info-row"><div className="k">Employee ID:</div><div className="v">{driver?.empCode || '—'}</div></div>
                  <div className="drv-info-row"><div className="k">Position:</div><div className="v">{driver?.position || '—'}</div></div>
                  <div className="drv-info-row"><div className="k">Email:</div><div className="v">{driver?.email || '—'}</div></div>
                  <div className="drv-info-row"><div className="k">Contact No.:</div><div className="v">{driver?.phone || '—'}</div></div>
                </div>

                <div className="drv-action-btns">
                  <button className="drv-action-btn edit" onClick={() => { setEditErr(''); setModal('edit') }}>
                    <IEdit /> Edit Profile
                  </button>
                  <button className="drv-action-btn pw" onClick={() => { setPwErr(''); setModal('password') }}>
                    <ILock /> Change Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mark Delivered Modal ── */}
      {modal === 'deliver' && deliverOrder && (
        <div className="drv-modal-bg">
          <div className="drv-modal">
            <h3>Mark as Delivered</h3>
            <p style={{ fontSize: 13, color: '#6b83a3', marginBottom: 8 }}>
              Order to: {deliverOrder.delivery} · Qty: {deliverOrder.qty}
            </p>
            <form onSubmit={markDelivered}>
              <label>Amount Paid by Customer (₱)</label>
              <input type="number" min="1" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus placeholder="e.g. 150" />
              {amountErr && <p className="drv-modal-err">{amountErr}</p>}
              <div className="drv-modal-row">
                <button type="button" className="drv-modal-btn ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="drv-modal-btn primary">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {modal === 'edit' && (
        <div className="drv-modal-bg">
          <div className="drv-modal">
            <h3>Edit Profile</h3>
            <form onSubmit={saveProfile}>
              <label>Full Name<input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></label>
              <label>Contact Number</label>
              <input
                value={editForm.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 11)
                  setEditForm({ ...editForm, phone: val })
                }}
                placeholder="09XXXXXXXXX"
                maxLength={11}
                pattern="\d{11}"
                title="Enter an 11-digit phone number"
              />
              <label>Email<input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></label>
              <label>Address<input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></label>
              {editErr && <p className="drv-modal-err">{editErr}</p>}
              <div className="drv-modal-row">
                <button type="button" className="drv-modal-btn ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="drv-modal-btn primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {modal === 'password' && (
        <div className="drv-modal-bg">
          <div className="drv-modal">
            <h3>Change Password</h3>
            <form onSubmit={changePassword}>
              <label>Current Password<input type="password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} required /></label>
              <label>New Password<input type="password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} required /></label>
              <label>Confirm Password<input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required /></label>
              {pwErr && <p className="drv-modal-err">{pwErr}</p>}
              <div className="drv-modal-row">
                <button type="button" className="drv-modal-btn ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="drv-modal-btn primary">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DriverDashboard
