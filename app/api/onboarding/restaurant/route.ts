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

  const { name, cuisineType, city, vibe } = await req.json()
  if (!name || !cuisineType || !city || !vibe) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }
  if (name.length > 100 || cuisineType.length > 100 || city.length > 100 || vibe.length > 500)
    return NextResponse.json({ error: 'One or more fields exceed maximum length' }, { status: 400 })

  const existing = await db.restaurant.findFirst({ where: { userId: user.id } })
  const restaurant = existing
    ? await db.restaurant.update({ where: { id: existing.id }, data: { name, cuisineType, city, vibe } })
    : await db.restaurant.create({ data: { userId: user.id, name, cuisineType, city, vibe } })

  return NextResponse.json({ restaurantId: restaurant.id })
}
