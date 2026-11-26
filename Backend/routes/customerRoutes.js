import { Router } from 'express'
import { getCustomer, updateCustomer, updatePhoto, changePassword } from '../controllers/customerController.js'

const router = Router()
router.get('/', getCustomer)
router.put('/', updateCustomer)
router.put('/photo', updatePhoto)
router.put('/password', changePassword)

export default router
