import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { checkRateLimit } from '@/lib/redis'

export async function GET() {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const allowed = await checkRateLimit(`insights:list:${restaurant.id}`, 60, 60)
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const insights = await db.insight.findMany({ where: { restaurantId: restaurant.id }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ insights })
}
