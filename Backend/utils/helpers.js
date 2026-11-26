export function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function badRequest(res, message, status = 400) {
  return res.status(status).json({ message })
}
