import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRestaurant } from '@/lib/user'
import { generateDraft } from '@/lib/ai'
import { checkRateLimit } from '@/lib/redis'
import { getPlanLimits } from '@/lib/limits'

export async function POST(req: Request) {
  const ctx = await requireRestaurant()
  if (!ctx.ok) return ctx.response
  const { restaurant } = ctx

  const restaurantWithSub = await db.restaurant.findUnique({ where: { id: restaurant.id }, include: { subscription: true } })
  if (!restaurantWithSub) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  let reviewId: unknown
  try {
    const body = await req.json()
    reviewId = body?.reviewId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!reviewId || typeof reviewId !== 'string') return NextResponse.json({ error: 'reviewId required' }, { status: 400 })

  // Verify review belongs to this restaurant before consuming rate limit quota
  const review = await db.review.findFirst({ where: { id: reviewId, restaurantId: restaurant.id } })
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  const plan = restaurantWithSub.subscription?.plan ?? 'FREE'
  const limits = getPlanLimits(plan)
  const allowed = await checkRateLimit(`drafts:${restaurant.id}`, limits.draftsPerMonth, 30 * 24 * 3600, { failOpen: false })
  if (!allowed) {
    return NextResponse.json({
      error: plan === 'FREE' ? 'UPGRADE_REQUIRED' : 'RATE_LIMITED',
      message: plan === 'FREE'
        ? `Free plan: ${limits.draftsPerMonth} AI drafts/month. Upgrade to continue.`
        : `Plan limit reached: ${limits.draftsPerMonth} AI drafts/month.`,
    }, { status: plan === 'FREE' ? 402 : 429 })
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
