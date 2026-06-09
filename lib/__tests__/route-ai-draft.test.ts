// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Hoisted mock fns so the vi.mock factories can reference them ---
const mockRequireRestaurant = vi.hoisted(() => vi.fn())
const mockCheckRateLimit = vi.hoisted(() => vi.fn())
const mockGenerateDraft = vi.hoisted(() => vi.fn())
const mockRestaurantFindUnique = vi.hoisted(() => vi.fn())
const mockReviewFindFirst = vi.hoisted(() => vi.fn())
const mockReviewResponseUpsert = vi.hoisted(() => vi.fn())

vi.mock('@/lib/user', () => ({
  requireRestaurant: mockRequireRestaurant,
}))

vi.mock('@/lib/redis', () => ({
  checkRateLimit: mockCheckRateLimit,
}))

vi.mock('@/lib/ai', () => ({
  generateDraft: mockGenerateDraft,
}))

vi.mock('@/lib/db', () => ({
  db: {
    restaurant: { findUnique: mockRestaurantFindUnique },
    review: { findFirst: mockReviewFindFirst },
    reviewResponse: { upsert: mockReviewResponseUpsert },
  },
}))

import { POST } from '@/app/api/ai/draft/route'

const RESTAURANT_ID = 'rest_self'

/** Build a Request whose .json() yields the given body (or throws for bad JSON). */
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
  // Default happy-path collaborators; individual tests override as needed.
  mockRestaurantFindUnique.mockResolvedValue({ id: RESTAURANT_ID, subscription: { plan: 'FREE' } })
  mockReviewFindFirst.mockResolvedValue({ id: 'rev_1', restaurantId: RESTAURANT_ID })
  mockCheckRateLimit.mockResolvedValue(true)
  mockGenerateDraft.mockResolvedValue('Thanks for your feedback!')
  mockReviewResponseUpsert.mockResolvedValue({})
})

describe('POST /api/ai/draft — auth + rate-limit + tenant-scoping envelope', () => {
  it('returns the guard response and does NOT proceed when there is no restaurant', async () => {
    const guard = { __guard: true } as any
    mockRequireRestaurant.mockResolvedValue({ ok: false, response: guard })

    const res = await POST(jsonReq({ reviewId: 'rev_1' }))

    expect(res).toBe(guard)
    // None of the protected work ran.
    expect(mockRestaurantFindUnique).not.toHaveBeenCalled()
    expect(mockReviewFindFirst).not.toHaveBeenCalled()
    expect(mockCheckRateLimit).not.toHaveBeenCalled()
    expect(mockGenerateDraft).not.toHaveBeenCalled()
  })

  it('returns 404 when the authed restaurant record cannot be loaded', async () => {
    authedAs()
    mockRestaurantFindUnique.mockResolvedValue(null)

    const res = await POST(jsonReq({ reviewId: 'rev_1' }))

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Restaurant not found' })
    expect(mockGenerateDraft).not.toHaveBeenCalled()
  })

  it('returns 400 on invalid JSON body', async () => {
    authedAs()
    const res = await POST(jsonReq(null, { badJson: true }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid JSON body' })
  })

  it('returns 400 when reviewId is missing / not a string', async () => {
    authedAs()
    const res = await POST(jsonReq({ reviewId: 123 }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'reviewId required' })
  })

  it('scopes the review lookup to the caller restaurantId (a foreign id cannot be drafted)', async () => {
    authedAs(RESTAURANT_ID)
    // Caller passes some reviewId; the route must constrain by restaurantId so a
    // review owned by another tenant returns 404 instead of leaking.
    mockReviewFindFirst.mockResolvedValue(null)

    const res = await POST(jsonReq({ reviewId: 'foreign_rev' }))

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Review not found' })
    // The Prisma where clause MUST include the caller's restaurantId.
    expect(mockReviewFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'foreign_rev', restaurantId: RESTAURANT_ID }),
      }),
    )
    // Quota is only consumed after ownership is proven — generateDraft never ran.
    expect(mockGenerateDraft).not.toHaveBeenCalled()
  })

  it('returns 402 (UPGRADE_REQUIRED) for a FREE plan over its monthly draft limit', async () => {
    authedAs()
    mockRestaurantFindUnique.mockResolvedValue({ id: RESTAURANT_ID, subscription: { plan: 'FREE' } })
    mockCheckRateLimit.mockResolvedValue(false)

    const res = await POST(jsonReq({ reviewId: 'rev_1' }))

    expect(res.status).toBe(402)
    const body = await res.json()
    expect(body.error).toBe('UPGRADE_REQUIRED')
    expect(mockGenerateDraft).not.toHaveBeenCalled()
    // FREE plan limit is 3 drafts/month and the limiter is fail-CLOSED.
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      `drafts:${RESTAURANT_ID}`,
      3,
      30 * 24 * 3600,
      { failOpen: false },
    )
  })

  it('returns 429 (RATE_LIMITED) for a paid plan over its monthly draft limit', async () => {
    authedAs()
    mockRestaurantFindUnique.mockResolvedValue({ id: RESTAURANT_ID, subscription: { plan: 'GROWTH' } })
    mockCheckRateLimit.mockResolvedValue(false)

    const res = await POST(jsonReq({ reviewId: 'rev_1' }))

    expect(res.status).toBe(429)
    expect((await res.json()).error).toBe('RATE_LIMITED')
    // GROWTH plan limit is 200 drafts/month.
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      `drafts:${RESTAURANT_ID}`,
      200,
      30 * 24 * 3600,
      { failOpen: false },
    )
  })

  it('generates and persists a draft on the happy path', async () => {
    authedAs()

    const res = await POST(jsonReq({ reviewId: 'rev_1' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ draft: 'Thanks for your feedback!' })
    expect(mockGenerateDraft).toHaveBeenCalledWith('rev_1')
    expect(mockReviewResponseUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { reviewId: 'rev_1' } }),
    )
  })

  it('maps NO_VOICE_SAMPLES from generateDraft to 422', async () => {
    authedAs()
    mockGenerateDraft.mockRejectedValue(new Error('NO_VOICE_SAMPLES'))

    const res = await POST(jsonReq({ reviewId: 'rev_1' }))

    expect(res.status).toBe(422)
    expect((await res.json()).error).toBe('NO_VOICE_SAMPLES')
  })
})
