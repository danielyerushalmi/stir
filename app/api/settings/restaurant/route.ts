export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { checkRateLimit } from '@/lib/redis'

export async function PUT(req: Request) {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const allowed = await checkRateLimit(`settings:restaurant:${restaurant.id}`, 20, 60)
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

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
  if (!name || !cuisineType || !city || !vibe)
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  if (typeof name !== 'string' || typeof cuisineType !== 'string' || typeof city !== 'string' || typeof vibe !== 'string')
    return NextResponse.json({ error: 'All fields must be strings' }, { status: 400 })
  if (name.length > 100 || cuisineType.length > 100 || city.length > 100 || vibe.length > 500)
    return NextResponse.json({ error: 'One or more fields exceed maximum length' }, { status: 400 })

  await db.restaurant.update({
    where: { id: restaurant.id },
    data: { name, cuisineType, city, vibe },
  })

  return NextResponse.json({ ok: true })
}
