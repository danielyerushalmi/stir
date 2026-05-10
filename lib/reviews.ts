import { db } from './db'

export function classifyReviewType(rating: number, text: string): string {
  const lower = text.toLowerCase()
  if (rating === 5) return 'positive_5star'
  if (lower.includes('wait') || lower.includes('slow') || lower.includes('minutes')) return 'wait_complaint'
  if (lower.includes('overpriced') || lower.includes('expensive') || lower.includes('price') || lower.includes('value')) return 'price_complaint'
  if (lower.includes('cold') || lower.includes('undercooked') || lower.includes('bland') || lower.includes('tasteless') || lower.includes('food')) return 'food_complaint'
  return 'mixed'
}

export async function getReviewsForRestaurant(restaurantId: string, page = 1, pageSize = 10) {
  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where: { restaurantId },
      include: { response: true },
      orderBy: { reviewDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.review.count({ where: { restaurantId } }),
  ])
  return { reviews, total, pages: Math.ceil(total / pageSize) }
}
