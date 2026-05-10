import type { ScoreResult } from '@/types'

const PLATFORM_WEIGHTS: Record<string, number> = {
  GOOGLE: 40,
  YELP: 25,
  TRIPADVISOR: 20,
  FACEBOOK: 15,
}

interface ReviewForScore {
  platform: string
  rating: number
  isDelivery: boolean
  reviewDate: Date
}

export function calculateOverallScore(reviews: ReviewForScore[]): number | null {
  const dineIn = reviews.filter(r => !r.isDelivery && PLATFORM_WEIGHTS[r.platform])
  if (dineIn.length === 0) return null

  const presentPlatforms = Array.from(new Set(dineIn.map(r => r.platform)))
  const totalWeight = presentPlatforms.reduce((sum, p) => sum + (PLATFORM_WEIGHTS[p] ?? 0), 0)

  let weightedSum = 0
  for (const platform of presentPlatforms) {
    const platformReviews = dineIn.filter(r => r.platform === platform)
    const avg = platformReviews.reduce((s, r) => s + r.rating, 0) / platformReviews.length
    const weight = (PLATFORM_WEIGHTS[platform] ?? 0) / totalWeight
    weightedSum += avg * weight
  }

  return Math.round(weightedSum * 10) / 10
}

export function calculateDeliveryScore(reviews: ReviewForScore[]): number | null {
  const delivery = reviews.filter(r => r.isDelivery)
  if (delivery.length === 0) return null
  const avg = delivery.reduce((s, r) => s + r.rating, 0) / delivery.length
  return Math.round(avg * 10) / 10
}

export function calculateTrend(reviews: ReviewForScore[]): { direction: 'up' | 'down' | 'flat'; delta: number } {
  const now = Date.now()
  const thirtyDays = 30 * 24 * 3600 * 1000
  const recent = reviews.filter(r => !r.isDelivery && now - r.reviewDate.getTime() <= thirtyDays)
  const prior = reviews.filter(r => !r.isDelivery && now - r.reviewDate.getTime() > thirtyDays && now - r.reviewDate.getTime() <= 2 * thirtyDays)

  if (recent.length === 0 || prior.length === 0) return { direction: 'flat', delta: 0 }

  const recentAvg = recent.reduce((s, r) => s + r.rating, 0) / recent.length
  const priorAvg = prior.reduce((s, r) => s + r.rating, 0) / prior.length
  const delta = Math.round((recentAvg - priorAvg) * 10) / 10

  return { direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat', delta: Math.abs(delta) }
}

export async function getScoreResult(restaurantId: string): Promise<ScoreResult> {
  const { db } = await import('./db')
  const reviews = await db.review.findMany({ where: { restaurantId } })
  return {
    overall: calculateOverallScore(reviews),
    trend: calculateTrend(reviews),
    deliveryScore: calculateDeliveryScore(reviews),
  }
}
