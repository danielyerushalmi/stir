export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'
import { checkRateLimit } from '@/lib/redis'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allowed = await checkRateLimit(`onboarding:restaurant:${userId}`, 10, 60)
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let name: unknown, cuisineType: unknown, city: unknown, vibe: unknown
  try {
    const body = await req.json()
    name = body?.name
    cuisineType = body?.cuisineType
    city = body?.city
    vibe = body?.vibe
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!name || !cuisineType || !city || !vibe) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }
  if (typeof name !== 'string' || typeof cuisineType !== 'string' || typeof city !== 'string' || typeof vibe !== 'string') {
    return NextResponse.json({ error: 'All fields must be strings' }, { status: 400 })
  }
  if (name.length > 100 || cuisineType.length > 100 || city.length > 100 || vibe.length > 500)
    return NextResponse.json({ error: 'One or more fields exceed maximum length' }, { status: 400 })

  const existing = await db.restaurant.findFirst({ where: { userId: user.id } })
  const restaurant = existing
    ? await db.restaurant.update({ where: { id: existing.id }, data: { name, cuisineType, city, vibe } })
    : await db.restaurant.create({ data: { userId: user.id, name, cuisineType, city, vibe } })

  return NextResponse.json({ restaurantId: restaurant.id })
}
