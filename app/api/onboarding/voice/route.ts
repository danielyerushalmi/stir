export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { VALID_REVIEW_TYPES } from '@/types'

export async function POST(req: Request) {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const { reviewType, sampleReview, ownerResponse } = await req.json()
  if (!reviewType || !sampleReview || !ownerResponse)
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  if (!VALID_REVIEW_TYPES.includes(reviewType))
    return NextResponse.json({ error: 'Invalid reviewType' }, { status: 400 })
  if (sampleReview.length > 1000 || ownerResponse.length > 1000)
    return NextResponse.json({ error: 'Sample text exceeds maximum length (1000 characters)' }, { status: 400 })

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
