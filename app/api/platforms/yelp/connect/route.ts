export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'
import { getBusinessByName, getReviews, YelpApiError } from '@/lib/yelp'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const body = await req.json()
  const businessName = String(body.businessName ?? '').trim()
  const location = String(body.location ?? '').trim()
  if (!businessName || !location) {
    return NextResponse.json({ error: 'businessName and location are required' }, { status: 400 })
  }

  try {
    const { businessId, rating, reviewCount } = await getBusinessByName(businessName, location)

    await db.$transaction([
      db.platform.upsert({
        where: { restaurantId_name: { restaurantId: restaurant.id, name: 'YELP' } },
        update: { isConnected: true, externalId: businessId, lastSyncedAt: new Date() },
        create: {
          restaurantId: restaurant.id,
          name: 'YELP',
          isConnected: true,
          externalId: businessId,
          lastSyncedAt: new Date(),
        },
      }),
      db.restaurant.update({
        where: { id: restaurant.id },
        data: { yelpBusinessId: businessId, yelpRating: rating, yelpReviewCount: reviewCount },
      }),
    ])

    const reviews = await getReviews(businessId)
    for (const r of reviews) {
      await db.review.upsert({
        where: { platform_externalId: { platform: 'YELP', externalId: r.externalId } },
        update: { rating: r.rating, reviewText: r.reviewText, authorName: r.authorName },
        create: {
          restaurantId: restaurant.id,
          platform: 'YELP',
          externalId: r.externalId,
          rating: r.rating,
          reviewText: r.reviewText,
          authorName: r.authorName,
          isDelivery: false,
          reviewDate: r.reviewDate,
        },
      })
    }

    return NextResponse.json({ ok: true, rating, reviewCount })
  } catch (err) {
    if (err instanceof YelpApiError && err.status === 404) {
      return NextResponse.json(
        { error: 'Business not found on Yelp. Check the name and location.' },
        { status: 404 },
      )
    }
    console.error('Yelp connect error:', err)
    return NextResponse.json({ error: 'Failed to connect Yelp. Please try again.' }, { status: 500 })
  }
}
