// Custom error class for expected business-logic errors
export class AppError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
    this.name = 'AppError'
  }
}

// Send a structured error response
export function sendError(res, err) {
  const status = err.status || 500
  const message = err instanceof AppError
    ? err.message
    : 'An unexpected server error occurred.'
  if (!(err instanceof AppError)) console.error(err)
  res.status(status).json({ message })
}
