import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'
import { getOAuthClient, postGoogleReply, GoogleDisconnectedError } from '@/lib/google'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const { reviewId, finalText, action, postToGoogle } = await req.json()
  if (action === 'approve' && typeof finalText === 'string' && finalText.length > 2000)
    return NextResponse.json({ error: 'Response text too long (max 2000 characters)' }, { status: 400 })

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
    if (review.response) {
      await db.reviewResponse.update({ where: { id: review.response.id }, data: { finalText, status: 'POSTED' } })
    } else {
      await db.reviewResponse.create({ data: { reviewId, draftText: finalText, finalText, status: 'POSTED' } })
    }

    if (postToGoogle && review.platform === 'GOOGLE') {
      const googlePlatform = await db.platform.findUnique({
        where: { restaurantId_name: { restaurantId: restaurant.id, name: 'GOOGLE' } },
      })

      if (googlePlatform?.isConnected && googlePlatform.externalId) {
        try {
          const client = await getOAuthClient(googlePlatform)
          await postGoogleReply(client, googlePlatform.externalId, review.externalId, finalText)
          return NextResponse.json({ ok: true, posted: true })
        } catch (err) {
          if (err instanceof GoogleDisconnectedError) {
            return NextResponse.json({ ok: true, posted: false, warning: 'Saved locally — reconnect Google to post.' })
          }
          const gErr = err as { response?: { data?: { error?: { message?: string } } } }
          const warning = gErr?.response?.data?.error?.message?.includes('already')
            ? 'This review already has a reply on Google.'
            : 'Saved locally — failed to post to Google. Please try again.'
          return NextResponse.json({ ok: true, posted: false, warning })
        }
      }
    }

    return NextResponse.json({ ok: true, posted: false })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
