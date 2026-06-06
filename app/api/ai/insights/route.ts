import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { generateInsights } from '@/lib/ai'
import { checkRateLimit } from '@/lib/redis'

export async function POST() {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const allowed = await checkRateLimit(`insights:${restaurant.id}`, 1, 24 * 3600)
  if (!allowed) return NextResponse.json({ error: 'Rate limited. Try again in 24 hours.' }, { status: 429 })

  try {
    await generateInsights(restaurant.id)
  } catch (err) {
    console.error('Insight generation error:', err)
    return NextResponse.json({ error: 'Failed to generate insights. Please try again.' }, { status: 500 })
  }
  const insights = await db.insight.findMany({ where: { restaurantId: restaurant.id }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ insights })
}
