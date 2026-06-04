export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { VALID_REVIEW_TYPES } from '@/types'

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
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
    where: { id: params.id, restaurantId: restaurant.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const sample = await db.voiceSample.update({
    where: { id: params.id },
    data: { reviewType, sampleReview, ownerResponse },
  })

  return NextResponse.json({ sample: { id: sample.id, reviewType: sample.reviewType, sampleReview: sample.sampleReview, ownerResponse: sample.ownerResponse } })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const existing = await db.voiceSample.findFirst({
    where: { id: params.id, restaurantId: restaurant.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.voiceSample.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}
