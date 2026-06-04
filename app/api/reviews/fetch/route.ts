export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { checkRateLimit } from '@/lib/redis'
import { getOAuthClient, fetchGoogleReviews, GoogleDisconnectedError } from '@/lib/google'

export async function POST() {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

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

    const existingIds = new Set(
      (await db.review.findMany({
        where: { restaurantId: restaurant.id, platform: 'GOOGLE' },
        select: { externalId: true },
      })).map(r => r.externalId),
    )

    // Split reviews into new vs existing
    const toCreate = googleReviews.filter(r => !existingIds.has(r.externalId))
    const toUpdate = googleReviews.filter(r => existingIds.has(r.externalId))

    // Batch create
    if (toCreate.length > 0) {
      await db.review.createMany({
        data: toCreate.map(r => ({
          restaurantId: restaurant.id,
          platform: 'GOOGLE',
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

    // Batch update in a transaction
    if (toUpdate.length > 0) {
      await db.$transaction(
        toUpdate.map(r =>
          db.review.update({
            where: { platform_externalId: { platform: 'GOOGLE', externalId: r.externalId } },
            data: { rating: r.rating, reviewText: r.reviewText, authorName: r.authorName },
          })
        )
      )
    }

    const newCount = toCreate.length
    const updatedCount = toUpdate.length

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
