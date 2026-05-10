import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'
import { generateDraft } from '@/lib/ai'
import { checkRateLimit } from '@/lib/redis'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id }, include: { subscription: true } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const plan = restaurant.subscription?.plan ?? 'FREE'
  if (plan === 'FREE') {
    const month = new Date().toISOString().slice(0, 7)
    const allowed = await checkRateLimit(`drafts:${restaurant.id}:${month}`, 3, 31 * 24 * 3600)
    if (!allowed) return NextResponse.json({ error: 'UPGRADE_REQUIRED', message: 'Free plan: 3 AI drafts per month. Upgrade to continue.' }, { status: 402 })
  }

  const { reviewId } = await req.json()

  // Verify review belongs to this restaurant
  const review = await db.review.findFirst({ where: { id: reviewId, restaurantId: restaurant.id } })
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  try {
    const draft = await generateDraft(reviewId)
    await db.reviewResponse.upsert({
      where: { reviewId },
      update: { draftText: draft, status: 'DRAFT' },
      create: { reviewId, draftText: draft, status: 'DRAFT' },
    })
    return NextResponse.json({ draft })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message === 'NO_VOICE_SAMPLES') {
      return NextResponse.json({ error: 'NO_VOICE_SAMPLES', message: 'Complete voice setup before generating drafts.' }, { status: 422 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
