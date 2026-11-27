import crypto from 'crypto'

//   Simple SHA-256 hash — replace with bcrypt in production
export function hashPassword(plain) {
  return crypto.createHash('sha256').update(String(plain)).digest('hex')
}

export function verifyPassword(plain, hash) {
  return hashPassword(plain) === hash
}
