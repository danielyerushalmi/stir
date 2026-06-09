import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'
import { getScoreResult } from '@/lib/scoring'
import { ScoreCard } from '@/components/dashboard/ScoreCard'
import { UpgradeBanner } from '@/components/dashboard/UpgradeBanner'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>
}) {
  const { upgrade } = await searchParams
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await getOrCreateDbUser()
  if (!user) redirect('/sign-in')

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) redirect('/onboarding')

  const [voiceSamples, scores, awaitingReply, recentReviews, insights, totalReviews, respondedReviews] = await Promise.all([
    db.voiceSample.findMany({ where: { restaurantId: restaurant.id } }),
    getScoreResult(restaurant.id),
    db.review.count({ where: { restaurantId: restaurant.id, response: null } }),
    db.review.findMany({ where: { restaurantId: restaurant.id }, orderBy: { reviewDate: 'desc' }, take: 10, include: { response: true } }),
    db.insight.findMany({ where: { restaurantId: restaurant.id, isRead: false }, take: 3 }),
    db.review.count({ where: { restaurantId: restaurant.id } }),
    db.review.count({ where: { restaurantId: restaurant.id, response: { isNot: null } } }),
  ])

  const voiceComplete = voiceSamples.length >= 3
  const responseRate = totalReviews > 0 ? Math.round((respondedReviews / totalReviews) * 100) : 0

  const INSIGHT_STYLES = {
    ALERT: { bg: 'bg-red-light/30', border: 'border-l-red-dark', label: 'Alert', text: 'text-red-dark' },
    TIP: { bg: 'bg-green-light/40', border: 'border-l-green', label: 'Tip', text: 'text-green-dark' },
    DELIVERY_GAP: { bg: 'bg-amber-light/30', border: 'border-l-amber-dark', label: 'Delivery', text: 'text-amber-dark' },
  } as const
  const now = new Date()
  const hour = now.getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dayLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <main id="main-content" tabIndex={-1} className="p-4 md:p-8 focus:outline-none">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">{timeGreeting}, {restaurant.name}</h1>
          <p className="text-sm text-text-muted mt-1">{dayLabel}</p>
        </div>
        {awaitingReply > 0 && (
          <div className="relative inline-flex">
            <span className="absolute inset-0 rounded-full bg-orange/20 animate-ping" aria-hidden="true" />
            <span className="relative rounded-full bg-orange-light text-orange text-sm font-medium px-3 py-1">{awaitingReply} awaiting reply</span>
          </div>
        )}
      </div>

      {!voiceComplete && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-light bg-amber-light/40 px-5 py-4">
          <div>
            <p className="font-medium text-amber-dark text-sm">Complete your voice setup</p>
            <p className="text-xs text-amber-dark/80 mt-0.5">Train Stir to write responses in your voice.</p>
          </div>
          <Link href="/onboarding/voice" className="text-sm font-medium text-orange-dark hover:text-orange-dark underline-offset-2 hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2">Set up now →</Link>
        </div>
      )}

      {upgrade && (
        <UpgradeBanner planName={upgrade} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <ScoreCard label="Overall Score" score={scores.overall} trend={scores.trend} subtitle="Dine-in platforms only" />
        <ScoreCard label="Delivery Score" score={scores.deliveryScore} subtitle="Delivery orders only" />
        <ScoreCard label="Awaiting Reply" score={awaitingReply} integer subtitle={awaitingReply === 1 ? '1 unanswered review' : `${awaitingReply} unanswered reviews`} />
        <ScoreCard label="Response Rate" score={responseRate} integer subtitle={`${respondedReviews} of ${totalReviews} reviews`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-charcoal">Recent reviews</h2>
            <Link href="/dashboard/reviews" className="text-xs text-orange-dark hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2">View all →</Link>
          </div>
          {recentReviews.length === 0
            ? <div>
                <p className="text-sm text-text-muted">Connect your Google account to start pulling in reviews.</p>
                <Link href="/dashboard/settings?tab=platforms" className="mt-3 inline-flex items-center rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2">Connect Google →</Link>
              </div>
            : <div className="flex flex-col gap-0">
                {recentReviews.map(r => (
                  <div key={r.id} className={`flex items-start gap-3 py-3 border-b border-border last:border-0 pl-3 border-l-4 ${
                    r.rating >= 4 ? 'border-l-green' : r.rating <= 2 ? 'border-l-red-dark' : 'border-l-amber-dark'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-text-lighter uppercase">{r.platform}</span>
                        <span role="img" aria-label={`${r.rating} out of 5 stars`} className={`text-xs ${r.rating >= 4 ? 'text-green-dark' : r.rating <= 2 ? 'text-red-dark' : 'text-amber-dark'}`}><span aria-hidden="true">{'★'.repeat(r.rating)}</span></span>
                      </div>
                      <p className="text-sm text-charcoal line-clamp-1">{r.reviewText}</p>
                    </div>
                    {!r.response && <Link href="/dashboard/reviews" className="text-xs text-orange-dark shrink-0 hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2">Reply →</Link>}
                  </div>
                ))}
              </div>
          }
        </div>
        <div className="rounded-xl border border-border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-charcoal">What to fix</h2>
            <Link href="/dashboard/insights" className="text-xs text-orange-dark hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2">All insights →</Link>
          </div>
          {insights.length === 0
            ? <p className="text-sm text-text-muted">Generate insights to see recommendations.</p>
            : <div className="flex flex-col gap-3">
                {insights.map(i => (
                  <div key={i.id} className={`rounded-lg border-l-4 p-3 ${INSIGHT_STYLES[i.type as keyof typeof INSIGHT_STYLES]?.bg ?? 'bg-cream'} ${INSIGHT_STYLES[i.type as keyof typeof INSIGHT_STYLES]?.border ?? 'border-l-orange'}`}>
                    <p className={`text-xs font-medium mb-0.5 ${INSIGHT_STYLES[i.type as keyof typeof INSIGHT_STYLES]?.text ?? 'text-orange-dark'}`}>
                      {INSIGHT_STYLES[i.type as keyof typeof INSIGHT_STYLES]?.label ?? i.type}
                    </p>
                    <p className="text-sm font-medium text-charcoal">{i.title}</p>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{i.body}</p>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </main>
  )
}
