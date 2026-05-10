export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { reviewType, sampleReview, ownerResponse } = await req.json()
  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  await db.voiceSample.upsert({
    where: { id: `vs_${restaurant.id}_${reviewType}` },
    update: { ownerResponse, sampleReview },
    create: { id: `vs_${restaurant.id}_${reviewType}`, restaurantId: restaurant.id, reviewType, sampleReview, ownerResponse },
  })

  return NextResponse.json({ ok: true })
}
