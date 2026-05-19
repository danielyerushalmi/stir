export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function DELETE() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  try {
    await (await clerkClient()).users.deleteUser(userId)
  } catch (err) {
    console.error('Clerk user deletion failed:', err)
    return NextResponse.json({ error: 'Failed to delete account. Please try again.' }, { status: 500 })
  }

  await db.user.delete({ where: { id: user.id } })

  return NextResponse.json({ ok: true })
}
