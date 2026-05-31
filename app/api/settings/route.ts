export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({
    where: { userId: user.id },
    include: { platforms: true, voiceSamples: { orderBy: { createdAt: 'asc' } }, subscription: true },
  })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  return NextResponse.json({
    yelpAvailable: !!process.env.YELP_API_KEY,
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      cuisineType: restaurant.cuisineType,
      city: restaurant.city,
      vibe: restaurant.vibe,
      yelpRating: restaurant.yelpRating,
      yelpReviewCount: restaurant.yelpReviewCount,
    },
    platforms: restaurant.platforms.map(p => ({
      name: p.name,
      isConnected: p.isConnected,
      lastSyncedAt: p.lastSyncedAt,
    })),
    voiceSamples: restaurant.voiceSamples.map(v => ({
      id: v.id,
      reviewType: v.reviewType,
      sampleReview: v.sampleReview,
      ownerResponse: v.ownerResponse,
    })),
    subscription: restaurant.subscription ? { plan: restaurant.subscription.plan } : null,
  })
}
