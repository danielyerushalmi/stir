// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRequireRestaurant = vi.hoisted(() => vi.fn())
const mockCheckRateLimit = vi.hoisted(() => vi.fn())
const mockVoiceFindFirst = vi.hoisted(() => vi.fn())
const mockVoiceUpdate = vi.hoisted(() => vi.fn())
const mockVoiceDelete = vi.hoisted(() => vi.fn())

vi.mock('@/lib/user', () => ({
  requireRestaurant: mockRequireRestaurant,
}))

vi.mock('@/lib/redis', () => ({
  checkRateLimit: mockCheckRateLimit,
}))

vi.mock('@/lib/db', () => ({
  db: {
    voiceSample: {
      findFirst: mockVoiceFindFirst,
      update: mockVoiceUpdate,
      delete: mockVoiceDelete,
    },
  },
}))

import { PUT, DELETE } from '@/app/api/settings/voice/[id]/route'

const RESTAURANT_ID = 'rest_self'

function jsonReq(body: unknown, { badJson = false } = {}): Request {
  return {
    json: async () => {
      if (badJson) throw new SyntaxError('Unexpected token')
      return body
    },
  } as unknown as Request
}

/** Route signature: (req, { params: Promise<{id}> }). */
function ctxFor(id: string) {
  return { params: Promise.resolve({ id }) }
}

function authedAs(restaurantId = RESTAURANT_ID) {
  mockRequireRestaurant.mockResolvedValue({
    ok: true,
    user: { id: 'user_1' },
    restaurant: { id: restaurantId },
  })
}

const VALID_BODY = {
  reviewType: 'positive_5star',
  sampleReview: 'Great place',
  ownerResponse: 'Thank you so much',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCheckRateLimit.mockResolvedValue(true)
  mockVoiceFindFirst.mockResolvedValue({ id: 'vs_1', restaurantId: RESTAURANT_ID })
  mockVoiceUpdate.mockResolvedValue({
    id: 'vs_1', reviewType: 'positive_5star', sampleReview: 'Great place', ownerResponse: 'Thank you so much',
  })
  mockVoiceDelete.mockResolvedValue({})
})

describe('PUT /api/settings/voice/[id] — IDOR-scoped update', () => {
  it('returns the guard response and does NOT proceed when unauthenticated / no restaurant', async () => {
    const guard = { __guard: true } as any
    mockRequireRestaurant.mockResolvedValue({ ok: false, response: guard })

    const res = await PUT(jsonReq(VALID_BODY), ctxFor('vs_1'))

    expect(res).toBe(guard)
    expect(mockCheckRateLimit).not.toHaveBeenCalled()
    expect(mockVoiceFindFirst).not.toHaveBeenCalled()
    expect(mockVoiceUpdate).not.toHaveBeenCalled()
  })

  it('returns 429 when the rate limit is exceeded', async () => {
    authedAs()
    mockCheckRateLimit.mockResolvedValue(false)

    const res = await PUT(jsonReq(VALID_BODY), ctxFor('vs_1'))

    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: 'Too many requests.' })
    expect(mockCheckRateLimit).toHaveBeenCalledWith(`settings:voice:${RESTAURANT_ID}`, 20, 60)
    expect(mockVoiceFindFirst).not.toHaveBeenCalled()
  })

  it('returns 400 on invalid JSON body', async () => {
    authedAs()
    const res = await PUT(jsonReq(null, { badJson: true }), ctxFor('vs_1'))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid JSON body' })
  })

  it('returns 400 when required fields are missing', async () => {
    authedAs()
    const res = await PUT(jsonReq({ reviewType: 'positive_5star' }), ctxFor('vs_1'))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'All fields required' })
  })

  it('returns 400 for an unknown reviewType', async () => {
    authedAs()
    const res = await PUT(jsonReq({ ...VALID_BODY, reviewType: 'not_a_type' }), ctxFor('vs_1'))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid reviewType' })
  })

  it('returns 400 when sample text exceeds the max length', async () => {
    authedAs()
    const res = await PUT(jsonReq({ ...VALID_BODY, sampleReview: 'a'.repeat(1001) }), ctxFor('vs_1'))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Sample text exceeds maximum length (1000 characters)' })
  })

  it('scopes lookup to caller restaurantId and 404s a sample owned by another tenant (IDOR-safe)', async () => {
    authedAs(RESTAURANT_ID)
    mockVoiceFindFirst.mockResolvedValue(null)

    const res = await PUT(jsonReq(VALID_BODY), ctxFor('foreign_vs'))

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    // The ownership check MUST constrain by both the path id AND the caller's restaurantId.
    expect(mockVoiceFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'foreign_vs', restaurantId: RESTAURANT_ID }),
      }),
    )
    // A foreign id is never written.
    expect(mockVoiceUpdate).not.toHaveBeenCalled()
  })

  it('updates the sample on the happy path and returns the projected fields', async () => {
    authedAs()
    const res = await PUT(jsonReq(VALID_BODY), ctxFor('vs_1'))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      sample: {
        id: 'vs_1', reviewType: 'positive_5star', sampleReview: 'Great place', ownerResponse: 'Thank you so much',
      },
    })
    expect(mockVoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'vs_1' } }),
    )
  })
})

describe('DELETE /api/settings/voice/[id] — IDOR-scoped delete', () => {
  it('returns the guard response and does NOT proceed when unauthenticated / no restaurant', async () => {
    const guard = { __guard: true } as any
    mockRequireRestaurant.mockResolvedValue({ ok: false, response: guard })

    const res = await DELETE(jsonReq({}), ctxFor('vs_1'))

    expect(res).toBe(guard)
    expect(mockVoiceFindFirst).not.toHaveBeenCalled()
    expect(mockVoiceDelete).not.toHaveBeenCalled()
  })

  it('returns 429 when the rate limit is exceeded', async () => {
    authedAs()
    mockCheckRateLimit.mockResolvedValue(false)

    const res = await DELETE(jsonReq({}), ctxFor('vs_1'))

    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: 'Too many requests.' })
    expect(mockVoiceFindFirst).not.toHaveBeenCalled()
  })

  it('scopes lookup to caller restaurantId and 404s a foreign sample without deleting (IDOR-safe)', async () => {
    authedAs(RESTAURANT_ID)
    mockVoiceFindFirst.mockResolvedValue(null)

    const res = await DELETE(jsonReq({}), ctxFor('foreign_vs'))

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(mockVoiceFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'foreign_vs', restaurantId: RESTAURANT_ID }),
      }),
    )
    expect(mockVoiceDelete).not.toHaveBeenCalled()
  })

  it('deletes an owned sample and returns ok', async () => {
    authedAs()
    const res = await DELETE(jsonReq({}), ctxFor('vs_1'))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(mockVoiceDelete).toHaveBeenCalledWith({ where: { id: 'vs_1' } })
  })
})
