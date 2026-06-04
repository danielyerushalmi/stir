export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'

export async function PUT(req: Request) {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const { name, cuisineType, city, vibe } = await req.json()
  if (!name || !cuisineType || !city || !vibe)
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  if (name.length > 100 || cuisineType.length > 100 || city.length > 100 || vibe.length > 500)
    return NextResponse.json({ error: 'One or more fields exceed maximum length' }, { status: 400 })

  await db.restaurant.update({
    where: { id: restaurant.id },
    data: { name, cuisineType, city, vibe },
  })

  return NextResponse.json({ ok: true })
}
