export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db, rlsTransaction } from '@/lib/db'
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

  // Fail-closed: this route spends paid Yelp API quota, so a Redis outage
  // must not remove the limit (matches drafts/insights/reviews-fetch).
  const allowed = await checkRateLimit(`yelp:connect:${restaurant.id}`, 5, 60, { failOpen: false })
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

    await rlsTransaction(async (tx) => {
      await tx.platform.upsert({
        where: { restaurantId_name: { restaurantId: restaurant.id, name: 'YELP' } },
        update: { isConnected: true, externalId: businessId, lastSyncedAt: new Date() },
        create: {
          restaurantId: restaurant.id,
          name: 'YELP',
          isConnected: true,
          externalId: businessId,
          lastSyncedAt: new Date(),
        },
      })
      await tx.restaurant.update({
        where: { id: restaurant.id },
        data: { yelpBusinessId: businessId, yelpRating: rating, yelpReviewCount: reviewCount },
      })
    })

    const reviews = await getReviews(businessId)

    // Review has a GLOBAL unique key on (platform, externalId). If another
    // restaurant has already connected this same Yelp business, its review rows
    // share these externalIds — never touch them. Only create rows that are new
    // and update rows already owned by this restaurant.
    const existing = await db.review.findMany({
      where: { platform: 'YELP', externalId: { in: reviews.map(r => r.externalId) } },
      select: { externalId: true, restaurantId: true },
    })
    const mine = new Set(existing.filter(e => e.restaurantId === restaurant.id).map(e => e.externalId))
    const ownedByOther = new Set(existing.filter(e => e.restaurantId !== restaurant.id).map(e => e.externalId))

    const toCreate = reviews.filter(r => !mine.has(r.externalId) && !ownedByOther.has(r.externalId))
    const toUpdate = reviews.filter(r => mine.has(r.externalId))

    if (toCreate.length > 0) {
      await db.review.createMany({
        data: toCreate.map(r => ({
          restaurantId: restaurant.id,
          platform: 'YELP',
          externalId: r.externalId,
          rating: r.rating,
          reviewText: r.reviewText,
          authorName: r.authorName,
          isDelivery: false,
          reviewDate: r.reviewDate,
        })),
        skipDuplicates: true,
      })
    }

    if (toUpdate.length > 0) {
      await rlsTransaction(async (tx) => {
        for (const r of toUpdate) {
          await tx.review.updateMany({
            where: { restaurantId: restaurant.id, platform: 'YELP', externalId: r.externalId },
            data: { rating: r.rating, reviewText: r.reviewText, authorName: r.authorName },
          })
        }
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
