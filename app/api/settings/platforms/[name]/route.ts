export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function DELETE(
  _req: Request,
  { params }: { params: { name: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const VALID_PLATFORMS = ['GOOGLE', 'YELP', 'TRIPADVISOR', 'FACEBOOK', 'DOORDASH', 'UBEREATS', 'GRUBHUB']
  if (!VALID_PLATFORMS.includes(params.name)) return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })

  await db.platform.updateMany({
    where: { restaurantId: restaurant.id, name: params.name },
    data: { isConnected: false, accessToken: null, refreshToken: null, tokenExpiresAt: null },
  })

  return NextResponse.json({ ok: true })
}
