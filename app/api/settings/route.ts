export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { checkRateLimit } from '@/lib/redis'

export async function GET() {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const allowed = await checkRateLimit(`settings:get:${restaurant.id}`, 60, 60)
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const fullRestaurant = await db.restaurant.findUnique({
    where: { id: restaurant.id },
    include: { platforms: true, voiceSamples: { orderBy: { createdAt: 'asc' } }, subscription: true },
  })
  if (!fullRestaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  return NextResponse.json({
    yelpAvailable: !!process.env.YELP_API_KEY,
    restaurant: {
      id: fullRestaurant.id,
      name: fullRestaurant.name,
      cuisineType: fullRestaurant.cuisineType,
      city: fullRestaurant.city,
      vibe: fullRestaurant.vibe,
      yelpRating: fullRestaurant.yelpRating,
      yelpReviewCount: fullRestaurant.yelpReviewCount,
    },
    platforms: fullRestaurant.platforms.map(p => ({
      name: p.name,
      isConnected: p.isConnected,
      lastSyncedAt: p.lastSyncedAt,
    })),
    voiceSamples: fullRestaurant.voiceSamples.map(v => ({
      id: v.id,
      reviewType: v.reviewType,
      sampleReview: v.sampleReview,
      ownerResponse: v.ownerResponse,
    })),
    subscription: fullRestaurant.subscription ? { plan: fullRestaurant.subscription.plan } : null,
  })
}
