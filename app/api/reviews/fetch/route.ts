import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'
import { checkRateLimit } from '@/lib/redis'

export async function POST() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const allowed = await checkRateLimit(`reviews:fetch:${restaurant.id}`, 1, 600)
  if (!allowed) return NextResponse.json({ error: 'Rate limited. Try again in 10 minutes.' }, { status: 429 })

  // Phase 1: mock sync — reviews already in DB from seed. Just update lastSyncedAt.
  await db.platform.updateMany({ where: { restaurantId: restaurant.id }, data: { lastSyncedAt: new Date() } })

  const reviewCount = await db.review.count({ where: { restaurantId: restaurant.id } })
  return NextResponse.json({ synced: reviewCount })
}
