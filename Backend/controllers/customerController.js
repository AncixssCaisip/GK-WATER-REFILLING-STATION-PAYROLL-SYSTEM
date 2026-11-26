// CONTROLLER: checks the request, uses the model, sends the answer
import * as Customer from '../models/customerModel.js'
import { clean, badRequest } from '../utils/helpers.js'

const publicCustomer = ({ password, ...rest }) => rest // never send the password to the browser

export async function getCustomer(req, res) {
  const customer = await Customer.getCustomer()
  if (!customer) return res.json(null) // table is empty — no customer yet
  res.json(publicCustomer(customer))
}

export async function updateCustomer(req, res) {
  const name = clean(req.body.name), phone = clean(req.body.phone), address = clean(req.body.address)
  if (!name || !phone || !address) return badRequest(res, 'Fill in all the details.')
  const customer = await Customer.updateInfo({ name, phone, address })
  res.json(publicCustomer(customer))
}

export async function updatePhoto(req, res) {
  const { photo } = req.body
  if (typeof photo !== 'string' || !photo.startsWith('data:image/')) return badRequest(res, 'Invalid photo.')
  const customer = await Customer.updatePhoto(photo)
  res.json(publicCustomer(customer))
}

// The password is plain text only in this demo; a real system must hash it (for example with bcrypt).
export async function changePassword(req, res) {
  const current = await Customer.getCustomer()
  if (req.body.current !== current.password) return badRequest(res, 'The current password is incorrect.')
  if (typeof req.body.next !== 'string' || clean(req.body.next).length < 8) return badRequest(res, 'Use a password with at least 8 characters.')
  await Customer.updatePassword(req.body.next)
  res.json({ message: 'Password changed.' })
}
