import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function GET(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ reviews: [], total: 0, pages: 0 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ reviews: [], total: 0, pages: 0 })

  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1') || 1)
  const platform = url.searchParams.get('platform') || undefined
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
