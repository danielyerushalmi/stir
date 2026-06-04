export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { VALID_PLATFORMS } from '@/types'

export async function POST(req: Request) {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const { platform, externalId } = await req.json()
  if (!platform || !VALID_PLATFORMS.includes(platform)) return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  if (externalId !== undefined && externalId !== null) {
    if (platform === 'GOOGLE') {
      return NextResponse.json({ error: 'Google externalId must come from the OAuth callback, not user input' }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9_\-]{1,128}$/.test(String(externalId))) {
      return NextResponse.json({ error: 'Invalid externalId format' }, { status: 400 })
    }
  }

  await db.platform.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: platform } },
    update: { isConnected: true, externalId: externalId || `mock_${platform.toLowerCase()}` },
    create: { restaurantId: restaurant.id, name: platform, isConnected: true, externalId: externalId || `mock_${platform.toLowerCase()}` },
  })

  return NextResponse.json({ ok: true })
}
