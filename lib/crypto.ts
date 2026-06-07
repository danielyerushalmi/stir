import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const PREFIX = 'enc:'

function getKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32')
  }
  return Buffer.from(hex, 'hex')
}

export function encryptToken(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12) // 96-bit nonce for AES-256-GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${ciphertext.toString('hex')}`
}

// Handles both encrypted tokens (enc:...) and legacy plaintext tokens so that
// existing connected accounts keep working without requiring re-authentication.
export function decryptToken(value: string): string {
  if (!value.startsWith(PREFIX)) return value
  const key = getKey()
  const rest = value.slice(PREFIX.length)
  const colonAfterIv = rest.indexOf(':')
  const colonAfterTag = rest.indexOf(':', colonAfterIv + 1)
  if (colonAfterIv === -1 || colonAfterTag === -1) throw new Error('Invalid encrypted token format')
  const iv = Buffer.from(rest.slice(0, colonAfterIv), 'hex')
  const tag = Buffer.from(rest.slice(colonAfterIv + 1, colonAfterTag), 'hex')
  const ct = Buffer.from(rest.slice(colonAfterTag + 1), 'hex')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}
