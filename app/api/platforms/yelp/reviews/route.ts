export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'
import { getReviews, YelpApiError } from '@/lib/yelp'

export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant?.yelpBusinessId) {
    return NextResponse.json({ error: 'Yelp not connected' }, { status: 400 })
  }

  try {
    const yelpReviews = await getReviews(restaurant.yelpBusinessId)
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
