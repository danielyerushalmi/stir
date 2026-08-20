import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { getOAuthClient, postGoogleReply, GoogleDisconnectedError } from '@/lib/google'
import { checkRateLimit } from '@/lib/redis'

export async function POST(req: Request) {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const allowed = await checkRateLimit(`respond:${restaurant.id}`, 30, 60)
  if (!allowed) return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })

  let reviewId: unknown, finalText: unknown, action: unknown, postToGoogle: unknown
  try {
    const body = await req.json()
    reviewId = body?.reviewId
    finalText = body?.finalText
    action = body?.action
    postToGoogle = body?.postToGoogle
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!reviewId || typeof reviewId !== 'string') return NextResponse.json({ error: 'reviewId required' }, { status: 400 })
  const VALID_ACTIONS = ['approve', 'dismiss']
  if (!action || typeof action !== 'string' || !VALID_ACTIONS.includes(action))
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const review = await db.review.findFirst({
    where: { id: reviewId, restaurantId: restaurant.id },
    include: { response: true },
  })
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'dismiss') {
    if (review.response) {
      await db.reviewResponse.update({ where: { id: review.response.id }, data: { status: 'DISMISSED' } })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'approve') {
    if (typeof finalText !== 'string' || finalText.trim().length === 0) {
      return NextResponse.json({ error: 'finalText required for approve' }, { status: 400 })
    }
    if (finalText.length > 2000) {
      return NextResponse.json({ error: 'Response text too long (max 2000 characters)' }, { status: 400 })
    }

    // Resolve the paid gate BEFORE any write. The UI always requests posting,
    // so FREE plans degrade to save-only (with a clear upsell warning) instead
    // of a hard 402 that would block approving entirely.
    let wantsGooglePost = Boolean(postToGoogle) && review.platform === 'GOOGLE'
    let planWarning: string | undefined
    if (wantsGooglePost) {
      const sub = await db.subscription.findUnique({ where: { restaurantId: restaurant.id } })
      if ((sub?.plan ?? 'FREE') === 'FREE') {
        wantsGooglePost = false
        planWarning = 'Saved — posting to Google requires a paid plan. Copy your response to reply manually.'
      }
    }

    // Upsert so two concurrent approvals can't race duplicate create() calls
    // into the @unique reviewId constraint. Status stays APPROVED until an
    // external post actually succeeds.
    const saved = await db.reviewResponse.upsert({
      where: { reviewId },
      update: { finalText, status: 'APPROVED' },
      create: { reviewId, draftText: finalText, finalText, status: 'APPROVED' },
    })

    if (wantsGooglePost) {
      const googlePlatform = await db.platform.findUnique({
        where: { restaurantId_name: { restaurantId: restaurant.id, name: 'GOOGLE' } },
      })

      if (googlePlatform?.isConnected && googlePlatform.externalId) {
        try {
          const client = await getOAuthClient(googlePlatform)
          await postGoogleReply(client, googlePlatform.externalId, review.externalId, finalText)
          await db.reviewResponse.update({ where: { reviewId }, data: { status: 'POSTED' } })
          return NextResponse.json({ ok: true, posted: true, responseId: saved.id })
        } catch (err) {
          if (err instanceof GoogleDisconnectedError) {
            return NextResponse.json({ ok: true, posted: false, responseId: saved.id, warning: 'Saved locally — reconnect Google to post.' })
          }
          const gErr = err as { response?: { data?: { error?: { message?: string } } } }
          const warning = gErr?.response?.data?.error?.message?.includes('already')
            ? 'This review already has a reply on Google.'
            : 'Saved locally — failed to post to Google. Please try again.'
          return NextResponse.json({ ok: true, posted: false, responseId: saved.id, warning })
        }
      }
    }

    return NextResponse.json({ ok: true, posted: false, responseId: saved.id, ...(planWarning ? { warning: planWarning } : {}) })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
