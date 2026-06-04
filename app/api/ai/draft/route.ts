import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { generateDraft } from '@/lib/ai'
import { checkRateLimit } from '@/lib/redis'

export async function POST(req: Request) {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const restaurantWithSub = await db.restaurant.findUnique({ where: { id: restaurant.id }, include: { subscription: true } })
  if (!restaurantWithSub) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const { reviewId } = await req.json()
  if (!reviewId) return NextResponse.json({ error: 'reviewId required' }, { status: 400 })

  // Verify review belongs to this restaurant before consuming rate limit quota
  const review = await db.review.findFirst({ where: { id: reviewId, restaurantId: restaurant.id } })
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  const plan = restaurantWithSub.subscription?.plan ?? 'FREE'
  if (plan === 'FREE') {
    const month = new Date().toISOString().slice(0, 7)
    const allowed = await checkRateLimit(`drafts:${restaurant.id}:${month}`, 3, 31 * 24 * 3600)
    if (!allowed) return NextResponse.json({ error: 'UPGRADE_REQUIRED', message: 'Free plan: 3 AI drafts per month. Upgrade to continue.' }, { status: 402 })
  }

  try {
    const draft = await generateDraft(reviewId)
    await db.reviewResponse.upsert({
      where: { reviewId },
      update: { draftText: draft, status: 'DRAFT' },
      create: { reviewId, draftText: draft, status: 'DRAFT' },
    })
    return NextResponse.json({ draft })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'NO_VOICE_SAMPLES') {
      return NextResponse.json({ error: 'NO_VOICE_SAMPLES', message: 'Complete voice setup before generating drafts.' }, { status: 422 })
    }
    console.error('Draft generation error:', err)
    return NextResponse.json({ error: 'Failed to generate draft. Please try again.' }, { status: 500 })
  }
}
