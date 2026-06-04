export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { VALID_PLATFORMS } from '@/types'

export async function DELETE(
  _req: Request,
  { params }: { params: { name: string } },
) {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  if (!VALID_PLATFORMS.includes(params.name as typeof VALID_PLATFORMS[number])) return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })

  await db.platform.updateMany({
    where: { restaurantId: restaurant.id, name: params.name },
    data: { isConnected: false, accessToken: null, refreshToken: null, tokenExpiresAt: null },
  })

  if (params.name === 'YELP') {
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
