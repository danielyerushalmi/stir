import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, setUserContext } from './db'
import type { User, Restaurant } from '@prisma/client'

export async function getOrCreateDbUser() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  // Establish the RLS context before any DB access so database policies scope
  // every subsequent query in this request to this user.
  setUserContext(clerkUser.id)

  return db.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {},
    create: {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? clerkUser.primaryEmailAddress?.emailAddress ?? '',
    },
  })
}

type RequireRestaurantResult =
  | { ok: true; user: User; restaurant: Restaurant }
  | { ok: false; response: NextResponse }

export async function requireRestaurant(): Promise<RequireRestaurantResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  setUserContext(userId)

  const user = await getOrCreateDbUser()
  if (!user) return { ok: false, response: NextResponse.json({ error: 'User not found' }, { status: 404 }) }

  // Deterministic pick if a user ever has multiple restaurants (schema allows it).
  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } })
  if (!restaurant) return { ok: false, response: NextResponse.json({ error: 'Restaurant not found' }, { status: 404 }) }

  return { ok: true, user, restaurant }
}
