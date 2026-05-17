export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'
import { checkRateLimit } from '@/lib/redis'
import { getOAuthClient, fetchGoogleReviews, GoogleDisconnectedError } from '@/lib/google'

export async function POST() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const allowed = await checkRateLimit(`reviews:fetch:${restaurant.id}`, 1, 600)
  if (!allowed) return NextResponse.json({ error: 'Rate limited. Try again in 10 minutes.' }, { status: 429 })

  const googlePlatform = await db.platform.findUnique({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: 'GOOGLE' } },
  })

  if (!googlePlatform?.isConnected || !googlePlatform.externalId) {
    return NextResponse.json(
      { error: 'Google not connected. Connect your Google Business account in Settings.' },
      { status: 400 },
    )
  }

  try {
    const client = await getOAuthClient(googlePlatform)
    const googleReviews = await fetchGoogleReviews(client, googlePlatform.externalId)

    let newCount = 0
    let updatedCount = 0

    for (const r of googleReviews) {
      const existing = await db.review.findUnique({
        where: { platform_externalId: { platform: 'GOOGLE', externalId: r.externalId } },
      })

      if (existing) {
        await db.review.update({
          where: { id: existing.id },
          data: { rating: r.rating, reviewText: r.reviewText, authorName: r.authorName },
        })
        updatedCount++
      } else {
        await db.review.create({
          data: {
            restaurantId: restaurant.id,
            platform: 'GOOGLE',
            externalId: r.externalId,
            rating: r.rating,
            reviewText: r.reviewText,
            authorName: r.authorName,
            isDelivery: false,
            reviewDate: r.reviewDate,
          },
        })
        newCount++
      }
    }

    await db.platform.update({
      where: { id: googlePlatform.id },
      data: { lastSyncedAt: new Date() },
    })

    return NextResponse.json({ synced: newCount, updated: updatedCount })
  } catch (err) {
    if (err instanceof GoogleDisconnectedError) {
      return NextResponse.json(
        { error: 'Google account disconnected. Please reconnect in Settings.' },
        { status: 401 },
      )
    }
    console.error('Review sync error:', err)
    return NextResponse.json({ error: 'Failed to sync reviews. Please try again.' }, { status: 500 })
  }
}
