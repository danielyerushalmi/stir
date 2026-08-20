// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The OAuth callback is the app's entire OAuth security surface: CSRF nonce,
// user binding, token encryption, and redirect sanitization all live here.

const mockAuth = vi.hoisted(() => vi.fn())
const mockCookies = vi.hoisted(() => vi.fn())
const mockCheckRateLimit = vi.hoisted(() => vi.fn())
const mockGetOrCreateDbUser = vi.hoisted(() => vi.fn())
const mockRestaurantFindFirst = vi.hoisted(() => vi.fn())
const mockPlatformUpsert = vi.hoisted(() => vi.fn())
const mockExchangeCode = vi.hoisted(() => vi.fn())
const mockBuildClient = vi.hoisted(() => vi.fn())
const mockFetchLocations = vi.hoisted(() => vi.fn())
const mockEncryptToken = vi.hoisted(() => vi.fn())

vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }))
vi.mock('next/headers', () => ({ cookies: mockCookies }))
vi.mock('@/lib/redis', () => ({ checkRateLimit: mockCheckRateLimit }))
vi.mock('@/lib/user', () => ({ getOrCreateDbUser: mockGetOrCreateDbUser }))
vi.mock('@/lib/db', () => ({
  db: {
    restaurant: { findFirst: mockRestaurantFindFirst },
    platform: { upsert: mockPlatformUpsert },
  },
}))
vi.mock('@/lib/google', () => ({
  exchangeCodeForTokens: mockExchangeCode,
  buildClientFromTokens: mockBuildClient,
  fetchGoogleLocationNames: mockFetchLocations,
  encryptToken: mockEncryptToken,
}))

import { GET } from '@/app/api/auth/google/callback/route'

const USER_ID = 'user_clerk_1'
const NONCE = 'nonce-123'

function stateFor(overrides: Record<string, unknown> = {}): string {
  return Buffer.from(JSON.stringify({ nonce: NONCE, returnTo: '/onboarding/connect?connected=GOOGLE', userId: USER_ID, ...overrides })).toString('base64url')
}

function reqWith(params: Record<string, string>): Request {
  const url = new URL('https://app.example.com/api/auth/google/callback')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new Request(url)
}

const cookieDelete = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({ userId: USER_ID })
  mockCheckRateLimit.mockResolvedValue(true)
  mockCookies.mockResolvedValue({
    get: (name: string) => (name === 'google_oauth_nonce' ? { value: NONCE } : undefined),
    delete: cookieDelete,
  })
  mockGetOrCreateDbUser.mockResolvedValue({ id: 'db_user_1' })
  mockRestaurantFindFirst.mockResolvedValue({ id: 'rest_1' })
  mockExchangeCode.mockResolvedValue({ access_token: 'at', refresh_token: 'rt', expiry_date: 1750000000000 })
  mockBuildClient.mockReturnValue({})
  mockFetchLocations.mockResolvedValue(['accounts/1/locations/99'])
  mockEncryptToken.mockImplementation((t: string) => `enc(${t})`)
  mockPlatformUpsert.mockResolvedValue({})
})

describe('GET /api/auth/google/callback — security envelope', () => {
  it('redirects unauthenticated callers to /sign-in without touching tokens', async () => {
    mockAuth.mockResolvedValue({ userId: null })
    const res = await GET(reqWith({ code: 'c', state: stateFor() }))

    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.headers.get('location')).toContain('/sign-in')
    expect(mockExchangeCode).not.toHaveBeenCalled()
  })

  it('rejects a state whose nonce does not match the cookie (CSRF)', async () => {
    const res = await GET(reqWith({ code: 'c', state: stateFor({ nonce: 'attacker-nonce' }) }))

    expect(res.headers.get('location')).toContain('error=google_failed')
    expect(mockExchangeCode).not.toHaveBeenCalled()
    expect(mockPlatformUpsert).not.toHaveBeenCalled()
  })

  it('rejects when the nonce cookie is missing entirely', async () => {
    mockCookies.mockResolvedValue({ get: () => undefined, delete: cookieDelete })
    const res = await GET(reqWith({ code: 'c', state: stateFor() }))

    expect(res.headers.get('location')).toContain('error=google_failed')
    expect(mockExchangeCode).not.toHaveBeenCalled()
  })

  it('rejects a state bound to a different user (session-fixation guard)', async () => {
    const res = await GET(reqWith({ code: 'c', state: stateFor({ userId: 'someone_else' }) }))

    expect(res.headers.get('location')).toContain('error=oauth_mismatch')
    expect(mockExchangeCode).not.toHaveBeenCalled()
  })

  it('rejects malformed base64url state without throwing', async () => {
    const res = await GET(reqWith({ code: 'c', state: '!!!not-base64!!!' }))

    expect(res.headers.get('location')).toContain('error=google_failed')
    expect(mockExchangeCode).not.toHaveBeenCalled()
  })

  it('stores tokens ENCRYPTED and redirects to the sanitized returnTo on success', async () => {
    const res = await GET(reqWith({ code: 'c', state: stateFor() }))

    expect(mockPlatformUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { restaurantId_name: { restaurantId: 'rest_1', name: 'GOOGLE' } },
        update: expect.objectContaining({
          isConnected: true,
          accessToken: 'enc(at)',
          refreshToken: 'enc(rt)',
        }),
      }),
    )
    const location = res.headers.get('location')!
    expect(location).toContain('/onboarding/connect')
    expect(location).toContain('connected=GOOGLE')
    // Nonce cookie is single-use.
    expect(cookieDelete).toHaveBeenCalledWith('google_oauth_nonce')
  })

  it('neutralizes an absolute-URL returnTo (open-redirect guard)', async () => {
    const res = await GET(reqWith({ code: 'c', state: stateFor({ returnTo: 'https://evil.example.com/phish' }) }))

    const location = res.headers.get('location')!
    // Redirect must stay on our own origin; only the path may be honored.
    expect(new URL(location).origin).toBe('https://app.example.com')
    expect(location).not.toContain('evil.example.com')
  })

  it('redirects with google_no_location when the account manages no locations', async () => {
    mockFetchLocations.mockResolvedValue([])
    const res = await GET(reqWith({ code: 'c', state: stateFor() }))

    expect(res.headers.get('location')).toContain('error=google_no_location')
    expect(mockPlatformUpsert).not.toHaveBeenCalled()
  })

  it('maps provider error param to google_denied without exchanging the code', async () => {
    const res = await GET(reqWith({ error: 'access_denied', code: 'c', state: stateFor() }))

    expect(res.headers.get('location')).toContain('error=google_denied')
    expect(mockExchangeCode).not.toHaveBeenCalled()
  })

  it('fails to the generic error redirect when the token exchange returns no refresh_token', async () => {
    mockExchangeCode.mockResolvedValue({ access_token: 'at', refresh_token: null })
    const res = await GET(reqWith({ code: 'c', state: stateFor() }))

    expect(res.headers.get('location')).toContain('error=google_failed')
    expect(mockPlatformUpsert).not.toHaveBeenCalled()
  })
})
