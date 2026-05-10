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
