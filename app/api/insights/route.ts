import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ insights: [] })
  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ insights: [] })
  const insights = await db.insight.findMany({ where: { restaurantId: restaurant.id }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ insights })
}
