import { cn } from '@/lib/utils'

type TrendReview = { rating: number; reviewDate: Date; platform: string }

const WEEKS = 8
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const PLATFORM_LABELS: Record<string, string> = {
  GOOGLE: 'Google', YELP: 'Yelp', TRIPADVISOR: 'TripAdvisor',
  DOORDASH: 'DoorDash', UBEREATS: 'Uber Eats', GRUBHUB: 'Grubhub',
}

// Weekly average rating, oldest week first. Lives outside the component so the
// Date.now() anchor doesn't violate render purity (server-rendered once anyway).
function weeklyBuckets(reviews: TrendReview[]): { avg: number | null; count: number }[] {
  const now = Date.now()
  return Array.from({ length: WEEKS }, (_, i) => {
    const end = now - (WEEKS - 1 - i) * WEEK_MS
    const start = end - WEEK_MS
    const inWeek = reviews.filter(r => {
      const t = r.reviewDate.getTime()
      return t > start && t <= end
    })
    return {
      count: inWeek.length,
      avg: inWeek.length > 0 ? inWeek.reduce((s, r) => s + r.rating, 0) / inWeek.length : null,
    }
  })
}

/**
 * Server-rendered 8-week rating trend + platform breakdown. Pure SVG/CSS —
 * no chart library, no client JS, static (so no reduced-motion concerns).
 */
export function TrendSection({ reviews }: { reviews: TrendReview[] }) {
  const buckets = weeklyBuckets(reviews)
  const weeksWithData = buckets.filter(b => b.avg !== null).length

  // SVG geometry: x spread across 8 columns, y maps rating 1..5 → bottom..top.
  const W = 560, H = 120, PAD = 10
  const x = (i: number) => PAD + (i * (W - 2 * PAD)) / (WEEKS - 1)
  const y = (rating: number) => H - PAD - ((rating - 1) / 4) * (H - 2 * PAD)
  const points = buckets
    .map((b, i) => (b.avg !== null ? `${x(i)},${y(b.avg)}` : null))
    .filter(Boolean)
    .join(' ')

  // Platform breakdown over the same window.
  const byPlatform = new Map<string, { count: number; sum: number }>()
  for (const r of reviews) {
    const cur = byPlatform.get(r.platform) ?? { count: 0, sum: 0 }
    cur.count++
    cur.sum += r.rating
    byPlatform.set(r.platform, cur)
  }
  const platforms = [...byPlatform.entries()]
    .map(([name, v]) => ({ name, count: v.count, avg: v.sum / v.count }))
    .sort((a, b) => b.count - a.count)
  const maxCount = platforms[0]?.count ?? 1

  const overallAvg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <div className="lg:col-span-2 rounded-xl border border-border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-charcoal">Rating trend</h2>
          <span className="text-xs text-text-lighter">Last 8 weeks</span>
        </div>
        {weeksWithData < 2 ? (
          <p className="text-sm text-text-muted py-8 text-center">
            Not enough review history yet — the trend appears once reviews span a couple of weeks.
          </p>
        ) : (
          <figure>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-32"
              role="img"
              aria-label={`Weekly average rating over the last ${WEEKS} weeks${overallAvg ? `, overall average ${overallAvg} stars` : ''}`}
            >
              {/* Reference lines at 2, 3, 4 stars */}
              {[2, 3, 4].map(r => (
                <line key={r} x1={PAD} x2={W - PAD} y1={y(r)} y2={y(r)} stroke="currentColor" className="text-border" strokeWidth="1" strokeDasharray="4 6" />
              ))}
              <polyline points={points} fill="none" stroke="currentColor" className="text-orange" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {buckets.map((b, i) => b.avg !== null && (
                <circle key={i} cx={x(i)} cy={y(b.avg)} r="4" fill="currentColor" className="text-orange" />
              ))}
            </svg>
            <figcaption className="mt-2 flex items-center justify-between text-xs text-text-lighter">
              <span>{WEEKS} weeks ago</span>
              {overallAvg && <span className="font-medium text-text-muted">{overallAvg}★ average this period</span>}
              <span>This week</span>
            </figcaption>
          </figure>
        )}
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <h2 className="font-semibold text-charcoal mb-4">By platform</h2>
        {platforms.length === 0 ? (
          <p className="text-sm text-text-muted">No reviews in the last 60 days.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {platforms.map(p => (
              <li key={p.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-charcoal">{PLATFORM_LABELS[p.name] ?? p.name}</span>
                  <span className="text-text-muted text-xs">
                    {p.count} {p.count === 1 ? 'review' : 'reviews'} · {p.avg.toFixed(1)}★
                  </span>
                </div>
                <div className="h-2 rounded-full bg-cream overflow-hidden" role="presentation">
                  <div
                    className={cn('h-full rounded-full', p.avg >= 4 ? 'bg-green' : p.avg <= 2.5 ? 'bg-red-dark' : 'bg-orange')}
                    style={{ width: `${Math.max(8, (p.count / maxCount) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
