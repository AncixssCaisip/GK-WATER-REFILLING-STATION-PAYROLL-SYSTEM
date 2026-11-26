import * as Order from '../models/orderModel.js'
import * as Driver from '../models/driverModel.js'
import { clean, badRequest } from '../utils/helpers.js'

export async function listOrders(req, res) {
  const customerName = req.query.customer || null
  const orders = await Order.getOrders(customerName)
  res.json(orders)
}

export async function createOrder(req, res) {
  const driver = await Driver.findDriver(req.body.driverId)
  const qty = Math.floor(Number(req.body.qty))
  const pickup   = clean(req.body.pickup)
  const delivery = clean(req.body.delivery)
  const landmark = clean(req.body.landmark).slice(0, 150)
  const customerName = clean(req.body.customerName) || null

  if (!driver) return badRequest(res, 'Please choose a driver.')
  if (driver.status !== 'Available') return badRequest(res, 'The chosen driver is no longer available.')
  if (!pickup || !delivery) return badRequest(res, 'Pickup and delivery addresses are required.')
  if (!Number.isInteger(qty) || qty < 1 || qty > 100) return badRequest(res, 'Enter a quantity from 1 to 100 containers.')

  const order = await Order.addOrder({
    driver: driver.name,
    driver_id: driver.id,
    pickup, delivery, landmark, qty,
    customer_name: customerName,
  })
  res.status(201).json(order)
}
