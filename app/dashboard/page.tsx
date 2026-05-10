import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export default async function DashboardPage() {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')

  const user = await getOrCreateDbUser()
  if (!user) redirect('/sign-in')

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) redirect('/onboarding')

  const voiceSamples = await db.voiceSample.findMany({ where: { restaurantId: restaurant.id } })
  const voiceComplete = voiceSamples.length >= 3

  const reviewCount = await db.review.count({ where: { restaurantId: restaurant.id } })
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
        {reviewCount > 0 && (
          <span className="rounded-full bg-orange-light text-orange text-sm font-medium px-3 py-1">{reviewCount} reviews synced</span>
        )}
      </div>

      {!voiceComplete && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-light bg-amber-light/40 px-5 py-4">
          <div>
            <p className="font-medium text-amber-dark text-sm">Complete your voice setup</p>
            <p className="text-xs text-amber-dark/80 mt-0.5">Train Stir to write responses in your voice.</p>
          </div>
          <a href="/onboarding/voice" className="text-sm font-medium text-orange hover:text-orange-dark">Set up now →</a>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-xs font-medium text-text-lighter uppercase tracking-wide mb-2">Overall Score</p>
          <p className="text-3xl font-semibold text-charcoal">—</p>
          <p className="text-xs text-text-lighter mt-1">Sync reviews to calculate</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-xs font-medium text-text-lighter uppercase tracking-wide mb-2">Delivery Score</p>
          <p className="text-3xl font-semibold text-charcoal">—</p>
          <p className="text-xs text-text-lighter mt-1">Separate from dine-in</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-xs font-medium text-text-lighter uppercase tracking-wide mb-2">Awaiting Reply</p>
          <p className="text-3xl font-semibold text-charcoal">0</p>
          <p className="text-xs text-text-lighter mt-1">No unanswered reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-xl border border-border bg-white p-6">
          <h2 className="font-semibold text-charcoal mb-4">Recent reviews</h2>
          <p className="text-sm text-text-muted">No reviews yet. Reviews will appear here after syncing.</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="font-semibold text-charcoal mb-4">What to fix</h2>
          <p className="text-sm text-text-muted">Generate insights to see recommendations.</p>
        </div>
      </div>
    </div>
  )
}
