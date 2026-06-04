export type Platform = 'GOOGLE' | 'YELP' | 'TRIPADVISOR' | 'DOORDASH' | 'UBEREATS' | 'GRUBHUB'
export type ReviewStatus = 'DRAFT' | 'APPROVED' | 'POSTED' | 'DISMISSED'
export type InsightType = 'ALERT' | 'TIP' | 'DELIVERY_GAP'
export type Plan = 'FREE' | 'STARTER' | 'GROWTH' | 'AGENCY'
export type VoiceReviewType =
  | 'positive_5star'
  | 'service_complaint'
  | 'food_complaint'
  | 'wait_complaint'
  | 'price_complaint'
  | 'mixed'

export interface ScoreResult {
  overall: number | null
  trend: { direction: 'up' | 'down' | 'flat'; delta: number }
  deliveryScore: number | null
}

export const VALID_PLATFORMS = ['GOOGLE', 'YELP', 'TRIPADVISOR', 'FACEBOOK', 'DOORDASH', 'UBEREATS', 'GRUBHUB'] as const
export type PlatformName = typeof VALID_PLATFORMS[number]

export const VALID_REVIEW_TYPES = ['positive_5star', 'wait_complaint', 'price_complaint', 'food_complaint', 'service_complaint', 'mixed'] as const
export type ReviewType = typeof VALID_REVIEW_TYPES[number]
