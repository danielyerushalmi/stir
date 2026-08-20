export const dynamic = 'force-dynamic'

import { NextResponse, type NextRequest } from 'next/server'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { db, setUserContext } from '@/lib/db'

/**
 * Clerk webhook receiver. Signature-verified via svix using
 * CLERK_WEBHOOK_SIGNING_SECRET (Clerk dashboard → Webhooks → Signing Secret).
 *
 * Handles user.deleted so accounts removed outside the app (Clerk dashboard,
 * Clerk-hosted user profile) don't leave orphaned User/Restaurant/Review rows
 * whose @unique email would block that address from ever signing up again.
 */
export async function POST(req: NextRequest) {
  let evt
  try {
    evt = await verifyWebhook(req)
  } catch (err) {
    console.error('Clerk webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  if (evt.type === 'user.deleted') {
    const clerkId = evt.data.id
    if (typeof clerkId === 'string' && clerkId.length > 0) {
      // Bind the RLS context to the user being deleted so the row-level
      // policies permit the cascade once RLS_ENFORCED is on.
      setUserContext(clerkId)
      try {
        // deleteMany: idempotent — a replayed webhook or an already-deleted
        // user (in-app delete flow) is a no-op, not an error.
        await db.user.deleteMany({ where: { clerkId } })
      } catch (err) {
        console.error('Clerk webhook user.deleted cleanup failed:', err)
        // 500 so Clerk retries the delivery.
        return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
      } finally {
        setUserContext(undefined)
      }
    }
  }

  return NextResponse.json({ received: true })
}
