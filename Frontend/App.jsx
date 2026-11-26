import './style.css'
import './App.css'
import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

// Auth
import LoginPage    from './auth/LoginPage.jsx'
import RegisterPage from './auth/RegisterPage.jsx'
import OtpPage      from './auth/OtpPage.jsx'

// Admin dashboard
import Sidebar         from './components/Sidebar'
import HeaderContainer from './components/HeaderContainer'
import DashboardPage   from './pages/DashboardPage'
import EmployeePage    from './pages/EmployeePage'
import AttendancePage  from './pages/AttendancePage'
import PayrollPage     from './pages/PayrollPage'
import SettingsPage    from './pages/SettingsPage'

// Customer dashboard
import CustomerLayout from './customer/CustomerLayout.jsx'
import OrderWater     from './customer/OrderWater.jsx'
import Profile        from './customer/Profile.jsx'

// Employee portal — uncomment when EmployeeDashboard.jsx is available
import EmployeeDashboard from './employee/EmployeeDashboard.jsx'

// Driver portal
import DriverDashboard from './driver/DriverDashboard.jsx'

const TITLES = { dash: 'Dashboard', emp: 'Employees', att: 'Attendance', pay: 'Payroll', set: 'Settings' }
const emptyCustomer = { id: 0, name: '', phone: '', address: '', username: '', status: '', since: '', photo: null }

// ── Admin Dashboard ───────────────────────────────────────────────────────────
function AdminApp({ user, onLogout }) {
  const [view, setView]   = useState('dash')
  const [owner, setOwner] = useState({ name: user.name })
  const [message, setMessage] = useState('')

  const toast = (text) => { setMessage(text); setTimeout(() => setMessage(''), 2500) }

  const loadOwner = useCallback(() => {
    api('/settings/account').then(setOwner).catch((e) => console.log(e.message))
  }, [])

  useEffect(() => { loadOwner() }, [loadOwner])

  const pages = {
    dash: <DashboardPage />,
    emp:  <EmployeePage />,
    att:  <AttendancePage />,
    pay:  <PayrollPage />,
    set:  <SettingsPage toast={toast} onAccountChange={loadOwner} />,
  }

  return (
    <div className="app">
      <Sidebar view={view} onChange={setView} onLogout={onLogout} />
      <main>
        <HeaderContainer title={TITLES[view]} name={owner.name} />
        <div className="page">{pages[view]}</div>
      </main>
      {message && <div className="toast" role="status">{message}</div>}
    </div>
  )
}

// ── Customer Dashboard ────────────────────────────────────────────────────────
function CustomerApp({ user, onLogout }) {
  const [page, setPage]       = useState('order')
  const [customer, setCustomer] = useState(null)
  const [message, setMessage] = useState({})

  useEffect(() => {
    fetch('/api/customer')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Unable to load customer details.')
        return data
      })
      .then(setCustomer)
      .catch(() => setMessage({ text: 'Cannot reach the server. Start the backend first.', type: 'error' }))
  }, [])

  function go(next) { setMessage({}); setPage(next) }

  const title    = page === 'order' ? 'Order water' : 'My Profile'
  const subtitle = page === 'order'
    ? `Hello, ${customer ? customer.name.split(' ')[0] : user.name.split(' ')[0]}. Pick a driver who is available now.`
    : 'Your account and personal information'

  return (
    <CustomerLayout page={page} go={go} title={title} subtitle={subtitle}
      name={customer ? customer.name : user.name} message={message} onLogout={onLogout}>
      {page === 'order'   && <OrderWater showMessage={setMessage} customerName={user.name} />}
      {page === 'profile' && <Profile customer={customer || emptyCustomer} setCustomer={setCustomer} showMessage={setMessage} />}
    </CustomerLayout>
  )
}

// ── Root App ──────────────────────────────────────────────────────────────────
function App() {
  const [authPage, setAuthPage]       = useState('login')
  const [user, setUser]               = useState(null)
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingOtp, setPendingOtp]   = useState(null)

  function handleLogin(userData)    { setUser(userData) }
  function handleLogout()           { setUser(null); setAuthPage('login') }
  function handleRegistered(email, otp)  { setPendingEmail(email); setPendingOtp(otp || null); setAuthPage('otp') }

  if (!user) {
    if (authPage === 'register')
      return <RegisterPage onGoLogin={() => setAuthPage('login')} onRegistered={handleRegistered} />
    if (authPage === 'otp')
      return <OtpPage email={pendingEmail} initialOtp={pendingOtp} onVerified={() => setAuthPage('login')} onGoLogin={() => setAuthPage('login')} />
    return <LoginPage onLogin={handleLogin} onGoRegister={() => setAuthPage('register')} />
  }

  if (user.role === 'admin')    return <AdminApp       user={user} onLogout={handleLogout} />
  if (user.role === 'employee') return <EmployeeDashboard user={user} onLogout={handleLogout} />
  if (user.role === 'driver')   return <DriverDashboard  user={user} onLogout={handleLogout} />
  return <CustomerApp user={user} onLogout={handleLogout} />
}

export default App
