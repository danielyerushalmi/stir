export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db, setUserContext } from '@/lib/db'
import { checkRateLimit } from '@/lib/redis'

export async function DELETE() {
  // Deliberately NOT requireRestaurant(): deletion must stay retryable after a
  // partial failure, including once the restaurant/user rows are already gone.
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  setUserContext(userId)

  const allowed = await checkRateLimit(`account:delete:${userId}`, 3, 3600)
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  // Delete our data FIRST. The old Clerk-first order could leave an orphaned
  // User row whose @unique email permanently blocked that address from
  // re-signing up. DB-first is safe in the reverse failure mode: if the Clerk
  // delete then fails, the identity still exists and a retry of this route
  // simply skips the (already empty) DB step and retries Clerk.
  try {
    await db.user.deleteMany({ where: { clerkId: userId } })
  } catch (err) {
    console.error('DB user deletion failed:', err)
    return NextResponse.json({ error: 'Failed to delete account. Please try again.' }, { status: 500 })
  }

  try {
    await (await clerkClient()).users.deleteUser(userId)
  } catch (err) {
    console.error('Clerk user deletion failed after DB delete:', err)
    return NextResponse.json(
      { error: 'Your data was deleted, but removing the sign-in account failed. Please try again.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
