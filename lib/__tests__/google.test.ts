import { describe, it, expect, beforeEach } from 'vitest'
import { starRatingToNumber, GoogleDisconnectedError, getGoogleOAuthUrl } from '../google'

describe('starRatingToNumber', () => {
  it('maps ONE through FIVE to 1-5', () => {
    expect(starRatingToNumber('ONE')).toBe(1)
    expect(starRatingToNumber('TWO')).toBe(2)
    expect(starRatingToNumber('THREE')).toBe(3)
    expect(starRatingToNumber('FOUR')).toBe(4)
    expect(starRatingToNumber('FIVE')).toBe(5)
  })

  it('defaults to 3 for unknown values', () => {
    expect(starRatingToNumber('UNKNOWN')).toBe(3)
    expect(starRatingToNumber('')).toBe(3)
  })
})

describe('GoogleDisconnectedError', () => {
  it('is an Error subclass with correct name', () => {
    const err = new GoogleDisconnectedError()
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('GoogleDisconnectedError')
    expect(err.message).toContain('disconnected')
  })
})

describe('getGoogleOAuthUrl', () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret'
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback'
  })

  it('returns a Google accounts URL with required params', () => {
    const url = getGoogleOAuthUrl('my-state')
    expect(url).toContain('accounts.google.com')
    expect(url).toContain('state=my-state')
    expect(url).toContain('access_type=offline')
    expect(url).toContain('prompt=consent')
  })
})
