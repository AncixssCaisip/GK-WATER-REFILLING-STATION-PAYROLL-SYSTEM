import { Router } from 'express'
import { listAvailableDrivers } from '../controllers/driverController.js'

const router = Router()
router.get('/', listAvailableDrivers)

export default router
