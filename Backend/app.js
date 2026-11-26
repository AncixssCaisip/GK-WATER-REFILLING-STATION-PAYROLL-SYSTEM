import express from 'express'
import cors from 'cors'
import './db.js' // initialise database connection on startup

// Auth routes
import authRoutes from './routes/authRoutes.js'

// Customer dashboard routes
import customerRoutes from './routes/customerRoutes.js'
import driverRoutes from './routes/driverRoutes.js'
import orderRoutes from './routes/orderRoutes.js'

// Admin/Employee dashboard routes
import attendanceRoutes from './routes/attendanceRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import employeeRoutes from './routes/employeeRoutes.js'
import payrollRoutes from './routes/payrollRoutes.js'
import saleRoutes from './routes/saleRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import driverPortalRoutes from './routes/driverPortalRoutes.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'GK Water Refilling Station API' }))

// Auth
app.use('/api/auth', authRoutes)

// Customer dashboard
app.use('/api/customer', customerRoutes)
app.use('/api/drivers', driverRoutes)
app.use('/api/orders', orderRoutes)

// Admin/Employee dashboard
app.use('/api/attendance', attendanceRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/payroll', payrollRoutes)
app.use('/api/sales', saleRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/driver', driverPortalRoutes)

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({
    message: err.status === 413 ? 'Uploaded image is too large.' : 'An unexpected server error occurred.'
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Backend running on http://localhost:5000/`))
