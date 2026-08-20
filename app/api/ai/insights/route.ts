import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { generateInsights } from '@/lib/ai'
import { checkRateLimit } from '@/lib/redis'
import { getPlanLimits } from '@/lib/limits'

export async function POST() {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const restaurantWithSub = await db.restaurant.findUnique({ where: { id: restaurant.id }, include: { subscription: true } })
  const plan = restaurantWithSub?.subscription?.plan ?? 'FREE'
  const limits = getPlanLimits(plan)

  // Deterministic precondition BEFORE consuming the scarce daily quota:
  // generateInsights no-ops without recent reviews, so don't charge for it.
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  const reviewCount = await db.review.count({ where: { restaurantId: restaurant.id, reviewDate: { gte: since } } })
  if (reviewCount === 0) {
    return NextResponse.json({ error: 'NO_REVIEWS', message: 'Sync some reviews first — insights need review data to analyse.' }, { status: 422 })
  }

  const allowed = await checkRateLimit(`insights:${restaurant.id}`, limits.insightsPer24h, 24 * 3600, { failOpen: false })
  if (!allowed) return NextResponse.json({ error: 'Rate limited. Try again later.' }, { status: 429 })

  try {
    await generateInsights(restaurant.id)
  } catch (err) {
    console.error('Insight generation error:', err)
    return NextResponse.json({ error: 'Failed to generate insights. Please try again.' }, { status: 500 })
  }
  const insights = await db.insight.findMany({ where: { restaurantId: restaurant.id }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ insights })
}
