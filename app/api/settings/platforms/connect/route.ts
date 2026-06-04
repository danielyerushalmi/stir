export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'

export async function POST(req: Request) {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const { platform } = await req.json()
  const MOCK_PLATFORMS = ['TRIPADVISOR', 'FACEBOOK', 'DOORDASH', 'UBEREATS', 'GRUBHUB']
  if (!platform || !MOCK_PLATFORMS.includes(platform)) return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })

  await db.platform.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: platform } },
    update: { isConnected: true },
    create: {
      restaurantId: restaurant.id,
      name: platform,
      isConnected: true,
      externalId: `mock_${platform.toLowerCase()}`,
    },
  })

  return NextResponse.json({ ok: true })
}
