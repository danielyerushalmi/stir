// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateOverallScore, calculateDeliveryScore, calculateTrend, getScoreResult } from '../scoring'

vi.mock('@/lib/db', () => ({
  db: {
    review: { findMany: vi.fn() },
    restaurant: { findUnique: vi.fn() },
  },
}))

import { db } from '@/lib/db'

const makeReview = (platform: string, rating: number, isDelivery: boolean, daysAgo: number) => ({
  platform,
  rating,
  isDelivery,
  reviewDate: new Date(Date.now() - daysAgo * 86400000),
})

describe('calculateOverallScore', () => {
  it('returns null when no dine-in reviews', () => {
    expect(calculateOverallScore([])).toBeNull()
  })

  it('calculates weighted average for Google and Yelp only', () => {
    const reviews = [
      makeReview('GOOGLE', 4, false, 10),
      makeReview('YELP', 2, false, 10),
    ]
    // Google weight 40/(40+25) ≈ 0.615, Yelp 25/65 ≈ 0.385
    // 4 * 0.615 + 2 * 0.385 = 2.46 + 0.77 = 3.23
    const score = calculateOverallScore(reviews)
    expect(score).toBeCloseTo(3.2, 1)
  })

  it('excludes delivery reviews from overall score', () => {
    const reviews = [
      makeReview('GOOGLE', 5, false, 5),
      makeReview('DOORDASH', 1, true, 5),
    ]
    expect(calculateOverallScore(reviews)).toBe(5.0)
  })
})

describe('calculateOverallScore with platformAggregates', () => {
  it('uses aggregate value instead of stored review average for that platform', () => {
    const reviews = [
      makeReview('GOOGLE', 4, false, 10),
      makeReview('YELP', 2, false, 10), // stored says 2★ — should be overridden
    ]
    // YELP aggregate = 4.5, totalWeight = 40 + 25 = 65
    // score = 4 * (40/65) + 4.5 * (25/65) = 160/65 + 112.5/65 ≈ 4.2
    const score = calculateOverallScore(reviews, { YELP: 4.5 })
    expect(score).toBeCloseTo(4.2, 1)
  })

  it('includes an aggregate platform that has no stored reviews', () => {
    const reviews = [makeReview('GOOGLE', 4, false, 10)]
    // YELP has no stored reviews but aggregate = 3.0, totalWeight = 40 + 25 = 65
    // score = 4 * (40/65) + 3.0 * (25/65) = 160/65 + 75/65 ≈ 3.6
    const score = calculateOverallScore(reviews, { YELP: 3.0 })
    expect(score).toBeCloseTo(3.6, 1)
  })

  it('falls back to review average when platform has no aggregate entry', () => {
    const reviews = [
      makeReview('GOOGLE', 4, false, 10),
      makeReview('YELP', 2, false, 10),
    ]
    // Empty aggregates = same behaviour as no aggregates
    const score = calculateOverallScore(reviews, {})
    expect(score).toBeCloseTo(3.2, 1)
  })
})

describe('calculateDeliveryScore', () => {
  it('returns null when no delivery reviews', () => {
    expect(calculateDeliveryScore([])).toBeNull()
  })

  it('averages delivery review ratings', () => {
    const reviews = [
      makeReview('DOORDASH', 4, true, 5),
      makeReview('UBEREATS', 2, true, 5),
    ]
    expect(calculateDeliveryScore(reviews)).toBe(3.0)
  })
})

describe('calculateTrend', () => {
  it('returns flat when insufficient data', () => {
    expect(calculateTrend([])).toEqual({ direction: 'flat', delta: 0 })
  })

  it('detects upward trend', () => {
    const recent = [makeReview('GOOGLE', 5, false, 10), makeReview('GOOGLE', 5, false, 15)]
    const old = [makeReview('GOOGLE', 3, false, 40), makeReview('GOOGLE', 3, false, 45)]
    const trend = calculateTrend([...recent, ...old])
    expect(trend.direction).toBe('up')
    expect(trend.delta).toBeGreaterThan(0)
  })

  it('detects downward trend', () => {
    const recent = [makeReview('GOOGLE', 2, false, 5)]
    const old = [makeReview('GOOGLE', 5, false, 40)]
    const trend = calculateTrend([...recent, ...old])
    expect(trend.direction).toBe('down')
    expect(trend.delta).toBeGreaterThan(0)
  })

  it('returns flat when only recent reviews exist (no prior data)', () => {
    const reviews = [makeReview('GOOGLE', 4, false, 10)]
    expect(calculateTrend(reviews)).toEqual({ direction: 'flat', delta: 0 })
  })

  it('returns flat when only prior reviews exist (no recent data)', () => {
    const reviews = [makeReview('GOOGLE', 4, false, 50)]
    expect(calculateTrend(reviews)).toEqual({ direction: 'flat', delta: 0 })
  })

  it('ignores delivery reviews', () => {
    const reviews = [
      makeReview('GOOGLE', 5, false, 5),
      makeReview('DOORDASH', 1, true, 5),  // delivery — should be ignored
      makeReview('GOOGLE', 3, false, 40),
    ]
    const trend = calculateTrend(reviews)
    expect(trend.direction).toBe('up')
  })

  it('delta is always non-negative', () => {
    const recent = [makeReview('GOOGLE', 2, false, 5)]
    const old = [makeReview('GOOGLE', 5, false, 40)]
    const trend = calculateTrend([...recent, ...old])
    expect(trend.delta).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// getScoreResult (mocked db)
// ---------------------------------------------------------------------------

describe('getScoreResult', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return overall, trend, and deliveryScore properties', async () => {
    vi.mocked(db.review.findMany).mockResolvedValue([
      makeReview('GOOGLE', 5, false, 5),
    ] as any)
    vi.mocked(db.restaurant.findUnique).mockResolvedValue({ yelpRating: null } as any)

    const result = await getScoreResult('rest-1')

    expect(result).toHaveProperty('overall')
    expect(result).toHaveProperty('trend')
    expect(result).toHaveProperty('deliveryScore')
  })

  it('should use yelpRating from the restaurant row as a YELP platform aggregate', async () => {
    vi.mocked(db.review.findMany).mockResolvedValue([] as any)
    vi.mocked(db.restaurant.findUnique).mockResolvedValue({ yelpRating: 4.5 } as any)

    const result = await getScoreResult('rest-2')

    expect(result.overall).toBe(4.5)
  })

  it('should return null overall when no reviews and no yelpRating', async () => {
    vi.mocked(db.review.findMany).mockResolvedValue([] as any)
    vi.mocked(db.restaurant.findUnique).mockResolvedValue({ yelpRating: null } as any)

    const result = await getScoreResult('rest-3')

    expect(result.overall).toBeNull()
    expect(result.deliveryScore).toBeNull()
    expect(result.trend).toEqual({ direction: 'flat', delta: 0 })
  })

  it('should handle restaurant.findUnique returning null without throwing', async () => {
    vi.mocked(db.review.findMany).mockResolvedValue([] as any)
    vi.mocked(db.restaurant.findUnique).mockResolvedValue(null as any)

    await expect(getScoreResult('rest-4')).resolves.not.toThrow()
    const result = await getScoreResult('rest-4')
    expect(result.overall).toBeNull()
  })

  it('should calculate deliveryScore from delivery reviews', async () => {
    vi.mocked(db.review.findMany).mockResolvedValue([
      makeReview('DOORDASH', 4, true, 5),
      makeReview('UBEREATS', 2, true, 5),
    ] as any)
    vi.mocked(db.restaurant.findUnique).mockResolvedValue({ yelpRating: null } as any)

    const result = await getScoreResult('rest-5')

    expect(result.deliveryScore).toBe(3.0)
    expect(result.overall).toBeNull() // delivery reviews don't count toward overall
  })
})
