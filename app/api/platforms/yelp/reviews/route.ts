export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { getReviews, YelpApiError } from '@/lib/yelp'

export async function GET() {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const fullRestaurant = await db.restaurant.findUnique({ where: { id: restaurant.id }, select: { yelpBusinessId: true } })
  if (!fullRestaurant?.yelpBusinessId) {
    return NextResponse.json({ error: 'Yelp not connected' }, { status: 400 })
  }

  try {
    const yelpReviews = await getReviews(fullRestaurant.yelpBusinessId)
    const reviews = yelpReviews.map((r, i) => ({
      id: `yelp_live_${i}`,
      platform: 'YELP',
      externalId: r.externalId,
      rating: r.rating,
      reviewText: r.reviewText,
      authorName: r.authorName,
      isDelivery: false,
      reviewDate: r.reviewDate.toISOString(),
      response: null,
    }))
    return NextResponse.json({ reviews, total: reviews.length, pages: 1 })
  } catch (err) {
    if (err instanceof YelpApiError) {
      return NextResponse.json({ error: 'Failed to fetch Yelp reviews' }, { status: 502 })
    }
    return NextResponse.json({ error: 'Failed to fetch Yelp reviews' }, { status: 500 })
  }
}
