import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'
import { getScoreResult } from '@/lib/scoring'
import { ScoreCard } from '@/components/dashboard/ScoreCard'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { upgrade?: string }
}) {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')

  const user = await getOrCreateDbUser()
  if (!user) redirect('/sign-in')

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) redirect('/onboarding')

  const [voiceSamples, scores, awaitingReply, recentReviews, insights] = await Promise.all([
    db.voiceSample.findMany({ where: { restaurantId: restaurant.id } }),
    getScoreResult(restaurant.id),
    db.review.count({ where: { restaurantId: restaurant.id, response: null } }),
    db.review.findMany({ where: { restaurantId: restaurant.id }, orderBy: { reviewDate: 'desc' }, take: 10, include: { response: true } }),
    db.insight.findMany({ where: { restaurantId: restaurant.id, isRead: false }, take: 3 }),
  ])

  const voiceComplete = voiceSamples.length >= 3
  const now = new Date()
  const hour = now.getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dayLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">{timeGreeting}, {restaurant.name}</h1>
          <p className="text-sm text-text-muted mt-1">{dayLabel}</p>
        </div>
        {awaitingReply > 0 && (
          <span className="rounded-full bg-orange-light text-orange text-sm font-medium px-3 py-1">{awaitingReply} awaiting reply</span>
        )}
      </div>

      {!voiceComplete && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-light bg-amber-light/40 px-5 py-4">
          <div>
            <p className="font-medium text-amber-dark text-sm">Complete your voice setup</p>
            <p className="text-xs text-amber-dark/80 mt-0.5">Train Stir to write responses in your voice.</p>
          </div>
          <Link href="/onboarding/voice" className="text-sm font-medium text-orange hover:text-orange-dark">Set up now →</Link>
        </div>
      )}

      {searchParams.upgrade && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-orange/40 bg-orange-light px-5 py-4">
          <div>
            <p className="font-medium text-orange text-sm">Upgrade to {searchParams.upgrade}</p>
            <p className="text-xs text-orange/80 mt-0.5">Paid plans are coming soon. You&apos;ll be notified when they launch.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <ScoreCard label="Overall Score" score={scores.overall} trend={scores.trend} subtitle="Dine-in platforms only" />
        <ScoreCard label="Delivery Score" score={scores.deliveryScore} subtitle="Delivery orders only" />
        <ScoreCard label="Awaiting Reply" score={awaitingReply} integer subtitle={awaitingReply === 1 ? '1 unanswered review' : `${awaitingReply} unanswered reviews`} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-xl border border-border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-charcoal">Recent reviews</h2>
            <Link href="/dashboard/reviews" className="text-xs text-orange hover:underline">View all →</Link>
          </div>
          {recentReviews.length === 0
            ? <p className="text-sm text-text-muted">No reviews yet.</p>
            : <div className="flex flex-col gap-0">
                {recentReviews.map(r => (
                  <div key={r.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-text-lighter uppercase">{r.platform}</span>
                        <span className={`text-xs ${r.rating >= 4 ? 'text-green' : r.rating <= 2 ? 'text-red-dark' : 'text-amber-dark'}`}>{'★'.repeat(r.rating)}</span>
                      </div>
                      <p className="text-sm text-charcoal line-clamp-1">{r.reviewText}</p>
                    </div>
                    {!r.response && <Link href="/dashboard/reviews" className="text-xs text-orange shrink-0 hover:underline">Reply →</Link>}
                  </div>
                ))}
              </div>
          }
        </div>
        <div className="rounded-xl border border-border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-charcoal">What to fix</h2>
            <Link href="/dashboard/insights" className="text-xs text-orange hover:underline">All insights →</Link>
          </div>
          {insights.length === 0
            ? <p className="text-sm text-text-muted">Generate insights to see recommendations.</p>
            : <div className="flex flex-col gap-3">
                {insights.map(i => (
                  <div key={i.id} className="rounded-lg bg-warm-gray p-3">
                    <p className="text-xs font-medium text-orange mb-0.5">{i.type}</p>
                    <p className="text-sm font-medium text-charcoal">{i.title}</p>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{i.body}</p>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  )
}
