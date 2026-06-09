import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { VALID_PLATFORMS } from '@/types'
import { checkRateLimit } from '@/lib/redis'

export async function GET(req: Request) {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const allowed = await checkRateLimit(`reviews:list:${restaurant.id}`, 60, 60)
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1') || 1)
  const platform = url.searchParams.get('platform') || undefined
  if (platform && !VALID_PLATFORMS.includes(platform as typeof VALID_PLATFORMS[number])) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }
  const parsedRating = url.searchParams.get('rating') ? parseInt(url.searchParams.get('rating')!) : undefined
  const rating = parsedRating !== undefined && !Number.isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5
    ? parsedRating
    : undefined
  const pageSize = 10

  const where = {
    restaurantId: restaurant.id,
    ...(platform && { platform }),
    ...(rating !== undefined && { rating }),
  }

  const [reviews, total] = await Promise.all([
    db.review.findMany({ where, include: { response: true }, orderBy: { reviewDate: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    db.review.count({ where }),
  ])

  return NextResponse.json({ reviews, total, pages: Math.ceil(total / pageSize) })
}
