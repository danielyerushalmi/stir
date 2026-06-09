// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRequireRestaurant = vi.hoisted(() => vi.fn())
const mockCheckRateLimit = vi.hoisted(() => vi.fn())
const mockReviewFindFirst = vi.hoisted(() => vi.fn())
const mockReviewResponseUpdate = vi.hoisted(() => vi.fn())
const mockReviewResponseCreate = vi.hoisted(() => vi.fn())

vi.mock('@/lib/user', () => ({
  requireRestaurant: mockRequireRestaurant,
}))

vi.mock('@/lib/redis', () => ({
  checkRateLimit: mockCheckRateLimit,
}))

// The Google posting path is only reached for paid plans + postToGoogle; the tests
// below stay on the local-save path, but stub the module so the import resolves.
vi.mock('@/lib/google', () => ({
  getOAuthClient: vi.fn(),
  postGoogleReply: vi.fn(),
  GoogleDisconnectedError: class GoogleDisconnectedError extends Error {},
}))

vi.mock('@/lib/db', () => ({
  db: {
    review: { findFirst: mockReviewFindFirst },
    reviewResponse: { update: mockReviewResponseUpdate, create: mockReviewResponseCreate },
    subscription: { findUnique: vi.fn() },
    platform: { findUnique: vi.fn() },
  },
}))

import { POST } from '@/app/api/reviews/respond/route'

const RESTAURANT_ID = 'rest_self'

function jsonReq(body: unknown, { badJson = false } = {}): Request {
  return {
    json: async () => {
      if (badJson) throw new SyntaxError('Unexpected token')
      return body
    },
  } as unknown as Request
}

function authedAs(restaurantId = RESTAURANT_ID) {
  mockRequireRestaurant.mockResolvedValue({
    ok: true,
    user: { id: 'user_1' },
    restaurant: { id: restaurantId },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCheckRateLimit.mockResolvedValue(true)
  mockReviewFindFirst.mockResolvedValue({ id: 'rev_1', restaurantId: RESTAURANT_ID, platform: 'GOOGLE', response: null })
  mockReviewResponseUpdate.mockResolvedValue({})
  mockReviewResponseCreate.mockResolvedValue({})
})

describe('POST /api/reviews/respond — auth + rate-limit + tenant-scoping envelope', () => {
  it('returns the guard response and does NOT proceed when unauthenticated / no restaurant', async () => {
    const guard = { __guard: true } as any
    mockRequireRestaurant.mockResolvedValue({ ok: false, response: guard })

    const res = await POST(jsonReq({ reviewId: 'rev_1', action: 'dismiss' }))

    expect(res).toBe(guard)
    expect(mockCheckRateLimit).not.toHaveBeenCalled()
    expect(mockReviewFindFirst).not.toHaveBeenCalled()
  })

  it('returns 429 when the per-restaurant rate limit is exceeded (before any DB work)', async () => {
    authedAs()
    mockCheckRateLimit.mockResolvedValue(false)

    const res = await POST(jsonReq({ reviewId: 'rev_1', action: 'approve', finalText: 'Thanks' }))

    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: 'Too many requests. Please slow down.' })
    // Limiter keyed per restaurant: 30 requests / 60s.
    expect(mockCheckRateLimit).toHaveBeenCalledWith(`respond:${RESTAURANT_ID}`, 30, 60)
    expect(mockReviewFindFirst).not.toHaveBeenCalled()
  })

  it('returns 400 on invalid JSON body', async () => {
    authedAs()
    const res = await POST(jsonReq(null, { badJson: true }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid JSON body' })
  })

  it('returns 400 when reviewId is missing', async () => {
    authedAs()
    const res = await POST(jsonReq({ action: 'dismiss' }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'reviewId required' })
  })

  it('returns 400 on an action outside the allow-list', async () => {
    authedAs()
    const res = await POST(jsonReq({ reviewId: 'rev_1', action: 'delete' }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid action' })
  })

  it('scopes the review lookup to the caller restaurantId and 404s a foreign review', async () => {
    authedAs(RESTAURANT_ID)
    mockReviewFindFirst.mockResolvedValue(null)

    const res = await POST(jsonReq({ reviewId: 'foreign_rev', action: 'dismiss' }))

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(mockReviewFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'foreign_rev', restaurantId: RESTAURANT_ID }),
      }),
    )
    // No mutation happened on a review the caller doesn't own.
    expect(mockReviewResponseUpdate).not.toHaveBeenCalled()
    expect(mockReviewResponseCreate).not.toHaveBeenCalled()
  })

  it('rejects approve with empty finalText (400) without mutating', async () => {
    authedAs()
    const res = await POST(jsonReq({ reviewId: 'rev_1', action: 'approve', finalText: '   ' }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'finalText required for approve' })
    expect(mockReviewResponseCreate).not.toHaveBeenCalled()
  })

  it('rejects approve with over-long finalText (400)', async () => {
    authedAs()
    const res = await POST(jsonReq({ reviewId: 'rev_1', action: 'approve', finalText: 'a'.repeat(2001) }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Response text too long (max 2000 characters)' })
  })

  it('dismiss on a review with an existing response marks it DISMISSED and returns ok', async () => {
    authedAs()
    mockReviewFindFirst.mockResolvedValue({
      id: 'rev_1', restaurantId: RESTAURANT_ID, platform: 'GOOGLE',
      response: { id: 'resp_1' },
    })

    const res = await POST(jsonReq({ reviewId: 'rev_1', action: 'dismiss' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(mockReviewResponseUpdate).toHaveBeenCalledWith({
      where: { id: 'resp_1' },
      data: { status: 'DISMISSED' },
    })
  })

  it('approve without postToGoogle saves locally and returns posted:false', async () => {
    authedAs()
    const res = await POST(jsonReq({ reviewId: 'rev_1', action: 'approve', finalText: 'Thank you!' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, posted: false })
    expect(mockReviewResponseCreate).toHaveBeenCalledWith({
      data: { reviewId: 'rev_1', draftText: 'Thank you!', finalText: 'Thank you!', status: 'POSTED' },
    })
  })
})
