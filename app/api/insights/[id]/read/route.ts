import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Ownership check: insight must belong to user's restaurant
  const insight = await db.insight.findFirst({ where: { id: params.id, restaurantId: restaurant.id } })
  if (!insight) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.insight.update({ where: { id: params.id }, data: { isRead: true } })
  return NextResponse.json({ ok: true })
}
