import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'
import { generateInsights } from '@/lib/ai'
import { checkRateLimit } from '@/lib/redis'

export async function POST() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const allowed = await checkRateLimit(`insights:${restaurant.id}`, 1, 24 * 3600)
  if (!allowed) return NextResponse.json({ error: 'Rate limited. Try again in 24 hours.' }, { status: 429 })

  await generateInsights(restaurant.id)
  const insights = await db.insight.findMany({ where: { restaurantId: restaurant.id }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ insights })
}
