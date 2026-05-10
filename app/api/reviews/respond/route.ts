import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const { reviewId, finalText, action } = await req.json()

  const review = await db.review.findFirst({
    where: { id: reviewId, restaurantId: restaurant.id },
    include: { response: true },
  })
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'dismiss') {
    if (review.response) {
      await db.reviewResponse.update({ where: { id: review.response.id }, data: { status: 'DISMISSED' } })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'approve') {
    if (review.response) {
      await db.reviewResponse.update({ where: { id: review.response.id }, data: { finalText, status: 'POSTED' } })
    } else {
      await db.reviewResponse.create({ data: { reviewId, draftText: finalText, finalText, status: 'POSTED' } })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
