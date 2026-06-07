export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { VALID_PLATFORMS } from '@/types'
import { checkRateLimit } from '@/lib/redis'

export async function POST(req: Request) {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const allowed = await checkRateLimit(`onboarding:connect:${restaurant.id}`, 10, 60)
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  let platform: unknown, externalId: unknown
  try {
    const body = await req.json()
    platform = body?.platform
    externalId = body?.externalId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!platform || typeof platform !== 'string' || !VALID_PLATFORMS.includes(platform as typeof VALID_PLATFORMS[number])) return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  if (externalId !== undefined && externalId !== null) {
    if (platform === 'GOOGLE') {
      return NextResponse.json({ error: 'Google externalId must come from the OAuth callback, not user input' }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9_\-]{1,128}$/.test(String(externalId))) {
      return NextResponse.json({ error: 'Invalid externalId format' }, { status: 400 })
    }
  }

  const safeExternalId = (typeof externalId === 'string' && externalId) ? externalId : `mock_${platform.toLowerCase()}`
  await db.platform.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: platform } },
    update: { isConnected: true, externalId: safeExternalId },
    create: { restaurantId: restaurant.id, name: platform, isConnected: true, externalId: safeExternalId },
  })

  return NextResponse.json({ ok: true })
}
