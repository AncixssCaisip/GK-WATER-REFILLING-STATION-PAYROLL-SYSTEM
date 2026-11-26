// Returns today's date as YYYY-MM-DD (Philippine local time)
export function today() {
  return new Date().toLocaleDateString('en-CA') // en-CA gives YYYY-MM-DD format
}

// Returns the current time as HH:MM:SS
export function now() {
  return new Date().toLocaleTimeString('en-PH', { hour12: false })
}

// Formats a number as Philippine peso — e.g. ₱1,234.50
export function peso(amount) {
  return '₱' + Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
