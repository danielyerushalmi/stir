import { describe, it, expect } from 'vitest'
import { calculateOverallScore, calculateDeliveryScore, calculateTrend } from '../scoring'

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
})
