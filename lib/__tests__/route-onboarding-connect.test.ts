// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRequireRestaurant = vi.hoisted(() => vi.fn())
const mockCheckRateLimit = vi.hoisted(() => vi.fn())

vi.mock('@/lib/user', () => ({ requireRestaurant: mockRequireRestaurant }))
vi.mock('@/lib/redis', () => ({ checkRateLimit: mockCheckRateLimit }))

import { POST } from '@/app/api/onboarding/connect/route'

function jsonReq(body: unknown): Request {
  return { json: async () => body } as unknown as Request
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireRestaurant.mockResolvedValue({ ok: true, user: { id: 'u1' }, restaurant: { id: 'r1' } })
  mockCheckRateLimit.mockResolvedValue(true)
})

describe('POST /api/onboarding/connect — no fake connections', () => {
  it('rejects manual Yelp connect (no live integration to back it)', async () => {
    const res = await POST(jsonReq({ platform: 'YELP', externalId: 'some-listing' }))

    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('not yet available')
  })

  it('rejects manual TripAdvisor connect', async () => {
    const res = await POST(jsonReq({ platform: 'TRIPADVISOR' }))

    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('not yet available')
  })

  it('rejects Google here — it must go through the OAuth flow', async () => {
    const res = await POST(jsonReq({ platform: 'GOOGLE' }))

    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('OAuth')
  })

  it('rejects unknown platforms', async () => {
    const res = await POST(jsonReq({ platform: 'FAKEBOOK' }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid platform' })
  })
})
