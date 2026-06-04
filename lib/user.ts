import { auth } from '@clerk/nextjs/server'
import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from './db'
import type { User, Restaurant } from '@prisma/client'

export async function getOrCreateDbUser() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

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
  const { userId } = auth()
  if (!userId) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const user = await getOrCreateDbUser()
  if (!user) return { ok: false, response: NextResponse.json({ error: 'User not found' }, { status: 404 }) }

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return { ok: false, response: NextResponse.json({ error: 'Restaurant not found' }, { status: 404 }) }

  return { ok: true, user, restaurant }
}
