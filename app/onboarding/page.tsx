export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export default async function OnboardingIndex() {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')

  const user = await getOrCreateDbUser()
  if (!user) redirect('/sign-in')

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) redirect('/onboarding/restaurant')

  const platforms = await db.platform.findMany({ where: { restaurantId: restaurant.id, isConnected: true } })
  if (platforms.length === 0) redirect('/onboarding/connect')

  redirect('/dashboard')
}
