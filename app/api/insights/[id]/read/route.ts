import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  // Ownership check: insight must belong to user's restaurant
  const insight = await db.insight.findFirst({ where: { id: params.id, restaurantId: restaurant.id } })
  if (!insight) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.insight.update({ where: { id: params.id }, data: { isRead: true } })
  return NextResponse.json({ ok: true })
}
