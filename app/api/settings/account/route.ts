export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'

export async function DELETE() {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { user } = ctx

  try {
    await db.user.delete({ where: { id: user.id } })
  } catch (err) {
    console.error('DB user deletion failed:', err)
    return NextResponse.json({ error: 'Failed to delete account. Please try again.' }, { status: 500 })
  }

  try {
    await (await clerkClient()).users.deleteUser(user.clerkId)
  } catch (err) {
    console.error('Clerk user deletion failed after DB delete:', err)
  }

  return NextResponse.json({ ok: true })
}
