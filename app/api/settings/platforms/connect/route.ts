export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { checkRateLimit } from '@/lib/redis'

export async function POST(req: Request) {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const allowed = await checkRateLimit(`settings:platforms:connect:${restaurant.id}`, 10, 60)
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  let platform: unknown
  try {
    const body = await req.json()
    platform = body?.platform
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const MOCK_PLATFORMS = ['TRIPADVISOR', 'FACEBOOK', 'DOORDASH', 'UBEREATS', 'GRUBHUB']
  if (!platform || typeof platform !== 'string' || !MOCK_PLATFORMS.includes(platform)) return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })

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
