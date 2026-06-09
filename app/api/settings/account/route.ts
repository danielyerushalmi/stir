export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { checkRateLimit } from '@/lib/redis'

export async function DELETE() {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { user, restaurant } = ctx

  const allowed = await checkRateLimit(`account:delete:${restaurant.id}`, 3, 3600)
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  // Delete the Clerk identity FIRST. If it fails, bail out before touching the DB
  // so we never orphan the Clerk user or falsely report success.
  try {
    await (await clerkClient()).users.deleteUser(user.clerkId)
  } catch (err) {
    console.error('Clerk user deletion failed:', err)
    return NextResponse.json({ error: 'Failed to delete account. Please try again.' }, { status: 500 })
  }

  try {
    await db.user.delete({ where: { id: user.id } })
  } catch (err) {
    console.error('DB user deletion failed after Clerk delete:', err)
    return NextResponse.json({ error: 'Failed to delete account. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
