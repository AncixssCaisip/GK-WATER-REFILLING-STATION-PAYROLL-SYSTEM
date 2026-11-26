import * as Driver from '../models/driverModel.js'

export async function listAvailableDrivers(req, res) {
  try {
    const drivers = await Driver.getAvailableDrivers()
    res.json(drivers)
  } catch (e) {
    res.status(500).json({ message: 'Failed to load drivers.' })
  }
}
