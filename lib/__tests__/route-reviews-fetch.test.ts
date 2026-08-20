// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRequireRestaurant = vi.hoisted(() => vi.fn())
const mockCheckRateLimit = vi.hoisted(() => vi.fn())
const mockPlatformFindUnique = vi.hoisted(() => vi.fn())
const mockPlatformUpdate = vi.hoisted(() => vi.fn())
const mockReviewFindMany = vi.hoisted(() => vi.fn())
const mockReviewCreateMany = vi.hoisted(() => vi.fn())
const mockSubscriptionFindUnique = vi.hoisted(() => vi.fn())
const mockRlsTransaction = vi.hoisted(() => vi.fn())
const mockGetOAuthClient = vi.hoisted(() => vi.fn())
const mockFetchGoogleReviews = vi.hoisted(() => vi.fn())
const mockGenerateInsights = vi.hoisted(() => vi.fn())
const mockAfter = vi.hoisted(() => vi.fn())

vi.mock('@/lib/user', () => ({ requireRestaurant: mockRequireRestaurant }))
vi.mock('@/lib/redis', () => ({ checkRateLimit: mockCheckRateLimit }))
vi.mock('@/lib/ai', () => ({ generateInsights: mockGenerateInsights }))
vi.mock('@/lib/google', () => ({
  getOAuthClient: mockGetOAuthClient,
  fetchGoogleReviews: mockFetchGoogleReviews,
  GoogleDisconnectedError: class GoogleDisconnectedError extends Error {},
}))
vi.mock('@/lib/db', () => ({
  db: {
    platform: { findUnique: mockPlatformFindUnique, update: mockPlatformUpdate },
    review: { findMany: mockReviewFindMany, createMany: mockReviewCreateMany },
    subscription: { findUnique: mockSubscriptionFindUnique },
  },
  rlsTransaction: mockRlsTransaction,
}))
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: mockAfter,
}))

import { POST } from '@/app/api/reviews/fetch/route'

const RESTAURANT_ID = 'rest_self'

function authedAs(restaurantId = RESTAURANT_ID) {
  mockRequireRestaurant.mockResolvedValue({
    ok: true,
    user: { id: 'user_1' },
    restaurant: { id: restaurantId },
  })
}

const googleReview = (over: Record<string, unknown> = {}) => ({
  externalId: 'g1',
  rating: 5,
  reviewText: 'Great!',
  authorName: 'Sam',
  reviewDate: new Date('2026-06-01'),
  hasReply: false,
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  authedAs()
  mockCheckRateLimit.mockResolvedValue(true)
  mockPlatformFindUnique.mockResolvedValue({ id: 'plat_1', isConnected: true, externalId: 'accounts/1/locations/9' })
  mockPlatformUpdate.mockResolvedValue({})
  mockReviewFindMany.mockResolvedValue([])
  mockReviewCreateMany.mockResolvedValue({ count: 1 })
  mockSubscriptionFindUnique.mockResolvedValue({ plan: 'GROWTH' })
  mockGetOAuthClient.mockResolvedValue({})
  mockFetchGoogleReviews.mockResolvedValue({ reviews: [googleReview()], truncated: false })
  mockRlsTransaction.mockImplementation(async (fn: any) =>
    fn({ review: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) } }))
})

describe('POST /api/reviews/fetch', () => {
  it('is fail-CLOSED on the sync rate limit (Redis outage cannot bypass it)', async () => {
    mockCheckRateLimit.mockResolvedValue(false)
    const res = await POST()

    expect(res.status).toBe(429)
    expect(mockCheckRateLimit).toHaveBeenCalledWith(`reviews:fetch:${RESTAURANT_ID}`, 1, 600, { failOpen: false })
    expect(mockFetchGoogleReviews).not.toHaveBeenCalled()
  })

  it('400s when Google is not connected', async () => {
    mockPlatformFindUnique.mockResolvedValue({ isConnected: false, externalId: null })
    const res = await POST()

    expect(res.status).toBe(400)
    expect(mockFetchGoogleReviews).not.toHaveBeenCalled()
  })

  it('creates new reviews tenant-scoped with hasExternalReply persisted', async () => {
    mockFetchGoogleReviews.mockResolvedValue({
      reviews: [googleReview({ externalId: 'g_new', hasReply: true })],
      truncated: false,
    })
    const res = await POST()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ synced: 1, updated: 0, truncated: false })
    expect(mockReviewCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        restaurantId: RESTAURANT_ID,
        platform: 'GOOGLE',
        externalId: 'g_new',
        hasExternalReply: true,
      })],
      skipDuplicates: true,
    })
  })

  it('updates an existing review when hasExternalReply flips (reply added on Google)', async () => {
    mockReviewFindMany.mockResolvedValue([
      { externalId: 'g1', rating: 5, reviewText: 'Great!', authorName: 'Sam', hasExternalReply: false },
    ])
    mockFetchGoogleReviews.mockResolvedValue({
      reviews: [googleReview({ hasReply: true })],
      truncated: false,
    })
    const updateMany = vi.fn().mockResolvedValue({ count: 1 })
    mockRlsTransaction.mockImplementation(async (fn: any) => fn({ review: { updateMany } }))

    const res = await POST()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ synced: 0, updated: 1, truncated: false })
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ restaurantId: RESTAURANT_ID, externalId: 'g1' }),
        data: expect.objectContaining({ hasExternalReply: true }),
      }),
    )
  })

  it('surfaces truncation to the caller instead of silently under-syncing', async () => {
    mockFetchGoogleReviews.mockResolvedValue({ reviews: [googleReview()], truncated: true })
    const res = await POST()

    expect((await res.json()).truncated).toBe(true)
  })

  it('sizes the shared auto-insights budget by the plan limit, not a hardcoded 1', async () => {
    mockSubscriptionFindUnique.mockResolvedValue({ plan: 'GROWTH' })
    await POST()

    // GROWTH allows 5 insights/24h — the shared key must be checked at 5.
    expect(mockCheckRateLimit).toHaveBeenCalledWith(`insights:${RESTAURANT_ID}`, 5, 24 * 3600, { failOpen: false })
    expect(mockAfter).toHaveBeenCalledTimes(1)
  })

  it('does not schedule auto-insights when nothing new was synced', async () => {
    mockReviewFindMany.mockResolvedValue([
      { externalId: 'g1', rating: 5, reviewText: 'Great!', authorName: 'Sam', hasExternalReply: false },
    ])
    await POST()

    expect(mockAfter).not.toHaveBeenCalled()
  })
})
