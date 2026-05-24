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

  const { platform, externalId } = await req.json()
  const VALID_PLATFORMS = ['GOOGLE', 'YELP', 'TRIPADVISOR', 'FACEBOOK', 'DOORDASH', 'UBEREATS', 'GRUBHUB']
  if (!platform || !VALID_PLATFORMS.includes(platform)) return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  if (externalId !== undefined && externalId !== null) {
    if (platform === 'GOOGLE') {
      return NextResponse.json({ error: 'Google externalId must come from the OAuth callback, not user input' }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9_\-]{1,128}$/.test(String(externalId))) {
      return NextResponse.json({ error: 'Invalid externalId format' }, { status: 400 })
    }
  }
  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  await db.platform.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: platform } },
    update: { isConnected: true, externalId: externalId || `mock_${platform.toLowerCase()}` },
    create: { restaurantId: restaurant.id, name: platform, isConnected: true, externalId: externalId || `mock_${platform.toLowerCase()}` },
  })

  return NextResponse.json({ ok: true })
}
