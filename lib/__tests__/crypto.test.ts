// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

// AES-256-GCM requires a 32-byte key, encoded as 64 hex chars.
// lib/crypto.ts reads it from process.env.TOKEN_ENCRYPTION_KEY.
const TEST_KEY = 'a'.repeat(64)

beforeAll(() => {
  vi.stubEnv('TOKEN_ENCRYPTION_KEY', TEST_KEY)
})

afterAll(() => {
  vi.unstubAllEnvs()
})

// Imported after env is stubbed; getKey() is only called inside the functions,
// not at module load, so a static import is safe here.
import { encryptToken, decryptToken } from '../crypto'

const PREFIX = 'enc:'

describe('encryptToken / decryptToken', () => {
  it('round-trips: decrypt(encrypt(x)) returns the original plaintext', () => {
    const plaintext = 'ya29.super-secret-oauth-token'
    const encrypted = encryptToken(plaintext)
    expect(decryptToken(encrypted)).toBe(plaintext)
  })

  it('round-trips empty string and unicode plaintext', () => {
    expect(decryptToken(encryptToken(''))).toBe('')
    const unicode = 'café 🔐 naïve — токен'
    expect(decryptToken(encryptToken(unicode))).toBe(unicode)
  })

  it('produces ciphertext that differs from plaintext and carries the enc: prefix', () => {
    const plaintext = 'plain-token-value'
    const encrypted = encryptToken(plaintext)
    expect(encrypted).not.toBe(plaintext)
    expect(encrypted).not.toContain(plaintext)
    expect(encrypted.startsWith(PREFIX)).toBe(true)
  })

  it('emits the iv:tag:ciphertext structure after the prefix', () => {
    const encrypted = encryptToken('structure-check')
    const rest = encrypted.slice(PREFIX.length)
    const parts = rest.split(':')
    expect(parts).toHaveLength(3)
    // 12-byte IV -> 24 hex chars, 16-byte GCM tag -> 32 hex chars
    expect(parts[0]).toHaveLength(24)
    expect(parts[1]).toHaveLength(32)
    expect(parts[2].length).toBeGreaterThan(0)
  })

  it('uses a random IV: encrypting the same plaintext twice yields different ciphertexts', () => {
    const plaintext = 'same-input-every-time'
    const a = encryptToken(plaintext)
    const b = encryptToken(plaintext)
    expect(a).not.toBe(b)
    // both still decrypt back to the original
    expect(decryptToken(a)).toBe(plaintext)
    expect(decryptToken(b)).toBe(plaintext)
  })

  it('passes through legacy/plaintext values (no enc: prefix) unchanged on decrypt', () => {
    const legacy = 'legacy-plaintext-token-no-prefix'
    expect(decryptToken(legacy)).toBe(legacy)
    expect(decryptToken('')).toBe('')
  })

  it('throws when the auth tag is tampered with (GCM integrity check fails)', () => {
    const encrypted = encryptToken('integrity-protected')
    const [, iv, tag, ct] = encrypted.split(':')
    // Flip the first hex nibble of the auth tag.
    const flipped = (tag[0] === '0' ? '1' : '0') + tag.slice(1)
    const tampered = `${PREFIX}${iv}:${flipped}:${ct}`
    expect(() => decryptToken(tampered)).toThrow()
  })

  it('throws when the ciphertext body is tampered with', () => {
    const encrypted = encryptToken('integrity-protected-body')
    const [, iv, tag, ct] = encrypted.split(':')
    const flipped = (ct[0] === '0' ? '1' : '0') + ct.slice(1)
    const tampered = `${PREFIX}${iv}:${tag}:${flipped}`
    expect(() => decryptToken(tampered)).toThrow()
  })

  it('throws on a malformed encrypted token (missing the colon-delimited parts)', () => {
    expect(() => decryptToken(`${PREFIX}deadbeef`)).toThrow('Invalid encrypted token format')
  })
})

describe('key validation', () => {
  it('throws when TOKEN_ENCRYPTION_KEY is the wrong length', () => {
    vi.stubEnv('TOKEN_ENCRYPTION_KEY', 'tooshort')
    expect(() => encryptToken('x')).toThrow('TOKEN_ENCRYPTION_KEY')
    // restore the valid key for any later tests
    vi.stubEnv('TOKEN_ENCRYPTION_KEY', TEST_KEY)
  })

  it('throws when TOKEN_ENCRYPTION_KEY is missing', () => {
    vi.stubEnv('TOKEN_ENCRYPTION_KEY', '')
    expect(() => encryptToken('x')).toThrow('TOKEN_ENCRYPTION_KEY')
    vi.stubEnv('TOKEN_ENCRYPTION_KEY', TEST_KEY)
  })
})
