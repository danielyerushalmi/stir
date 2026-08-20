export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
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

  // No platform may be "connected" by pasting a URL/ID: Google connects via the
  // verified OAuth callback, and every other platform has no live integration
  // yet. This route used to mark platforms isConnected with a mock externalId,
  // which faked connections that could never sync a review.
  if (platform === 'GOOGLE') {
    return NextResponse.json({ error: 'Google must be connected via the OAuth flow' }, { status: 400 })
  }
  void externalId
  return NextResponse.json(
    { error: `${platform} is not yet available. It will appear in Settings when it launches.` },
    { status: 400 },
  )
}
