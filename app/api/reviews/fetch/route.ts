export const dynamic = 'force-dynamic'

import { NextResponse, after } from 'next/server'
import { db, rlsTransaction } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { checkRateLimit } from '@/lib/redis'
import { getOAuthClient, fetchGoogleReviews, GoogleDisconnectedError } from '@/lib/google'
import { generateInsights } from '@/lib/ai'

export async function POST() {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const allowed = await checkRateLimit(`reviews:fetch:${restaurant.id}`, 1, 600, { failOpen: false })
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

    const existing = new Map(
      (await db.review.findMany({
        where: { restaurantId: restaurant.id, platform: 'GOOGLE' },
        select: { externalId: true, rating: true, reviewText: true, authorName: true },
      })).map(r => [r.externalId, r]),
    )

    // Split reviews into new vs existing
    const toCreate = googleReviews.filter(r => !existing.has(r.externalId))
    // Only update rows whose content actually changed vs the DB.
    const toUpdate = googleReviews.filter(r => {
      const prev = existing.get(r.externalId)
      if (!prev) return false
      return (
        prev.rating !== r.rating ||
        prev.reviewText !== r.reviewText ||
        prev.authorName !== r.authorName
      )
    })

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
      await rlsTransaction(async (tx) => {
        for (const r of toUpdate) {
          await tx.review.updateMany({
            where: { restaurantId: restaurant.id, platform: 'GOOGLE', externalId: r.externalId },
            data: { rating: r.rating, reviewText: r.reviewText, authorName: r.authorName },
          })
        }
      })
    }

    const newCount = toCreate.length
    const updatedCount = toUpdate.length

    await db.platform.update({
      where: { id: googlePlatform.id },
      data: { lastSyncedAt: new Date() },
    })

    if (newCount > 0) {
      // Share the same rate-limit key as /api/ai/insights so both paths draw from one 24h budget.
      const insightsAllowed = await checkRateLimit(`insights:${restaurant.id}`, 1, 24 * 3600, { failOpen: false })
      if (insightsAllowed) {
        // Defer with after() so the work completes even after the response is sent,
        // instead of risking the serverless instance freezing mid-flight.
        after(() => generateInsights(restaurant.id).catch(err => console.error('Auto-insights error:', err)))
      }
    }

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
