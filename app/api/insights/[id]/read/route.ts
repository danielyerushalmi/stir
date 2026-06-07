import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { checkRateLimit } from '@/lib/redis'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const allowed = await checkRateLimit(`insights:read:${restaurant.id}`, 60, 60)
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const insight = await db.insight.findFirst({ where: { id, restaurantId: restaurant.id } })
  if (!insight) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.insight.update({ where: { id }, data: { isRead: true } })
  return NextResponse.json({ ok: true })
}
