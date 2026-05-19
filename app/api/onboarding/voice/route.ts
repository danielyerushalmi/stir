export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

const VALID_REVIEW_TYPES = ['positive_5star', 'wait_complaint', 'price_complaint', 'food_complaint', 'service_complaint', 'mixed']

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { reviewType, sampleReview, ownerResponse } = await req.json()
  if (!reviewType || !sampleReview || !ownerResponse)
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  if (!VALID_REVIEW_TYPES.includes(reviewType))
    return NextResponse.json({ error: 'Invalid reviewType' }, { status: 400 })
  if (sampleReview.length > 1000 || ownerResponse.length > 1000)
    return NextResponse.json({ error: 'Sample text exceeds maximum length (1000 characters)' }, { status: 400 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const existing = await db.voiceSample.findFirst({
    where: { restaurantId: restaurant.id, reviewType },
  })

  if (existing) {
    await db.voiceSample.update({
      where: { id: existing.id },
      data: { sampleReview, ownerResponse },
    })
  } else {
    await db.voiceSample.create({
      data: { restaurantId: restaurant.id, reviewType, sampleReview, ownerResponse },
    })
  }

  return NextResponse.json({ ok: true })
}
