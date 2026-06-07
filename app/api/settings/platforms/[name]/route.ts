export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { VALID_PLATFORMS } from '@/types'
import { checkRateLimit } from '@/lib/redis'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const allowed = await checkRateLimit(`settings:platforms:disconnect:${restaurant.id}`, 10, 60)
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  if (!VALID_PLATFORMS.includes(name as typeof VALID_PLATFORMS[number])) return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })

  await db.platform.updateMany({
    where: { restaurantId: restaurant.id, name },
    data: { isConnected: false, accessToken: null, refreshToken: null, tokenExpiresAt: null },
  })

  if (name === 'YELP') {
    await Promise.all([
      db.restaurant.update({
        where: { id: restaurant.id },
        data: { yelpBusinessId: null, yelpRating: null, yelpReviewCount: null },
      }),
      db.review.deleteMany({
        where: { restaurantId: restaurant.id, platform: 'YELP' },
      }),
    ])
  }

  return NextResponse.json({ ok: true })
}
