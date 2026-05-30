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

  const { platform } = await req.json()
  const MOCK_PLATFORMS = ['TRIPADVISOR', 'FACEBOOK', 'DOORDASH', 'UBEREATS', 'GRUBHUB']
  if (!platform || !MOCK_PLATFORMS.includes(platform)) return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

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
