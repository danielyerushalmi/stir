export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireRestaurant } from '@/lib/user'
import { checkRateLimit } from '@/lib/redis'

/**
 * Historically this endpoint marked platforms isConnected with a mock
 * externalId — a fake connection that could never sync a review. No UI calls
 * it anymore; it now always rejects. Delete it once a real integration ships
 * with its own verified connect flow (like Google's OAuth callback).
 */
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

  return NextResponse.json(
    { error: `${typeof platform === 'string' ? platform : 'This platform'} is not yet available.` },
    { status: 400 },
  )
}
