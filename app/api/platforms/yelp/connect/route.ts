export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { getBusinessByName, getReviews, YelpApiError } from '@/lib/yelp'
import { checkRateLimit } from '@/lib/redis'

export async function POST(req: Request) {
  if (!process.env.YELP_API_KEY) {
    return NextResponse.json({ error: 'Yelp integration is not yet available' }, { status: 503 })
  }

  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const allowed = await checkRateLimit(`yelp:connect:${restaurant.id}`, 5, 60)
  if (!allowed) return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })

  let rawBody: Record<string, unknown>
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const businessName = String(rawBody.businessName ?? '').trim()
  const location = String(rawBody.location ?? '').trim()
  if (!businessName || !location) {
    return NextResponse.json({ error: 'businessName and location are required' }, { status: 400 })
  }
  if (businessName.length > 200 || location.length > 200) {
    return NextResponse.json({ error: 'businessName and location must be 200 characters or fewer' }, { status: 400 })
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
