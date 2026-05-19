'use client'
import { useEffect, useState, useCallback } from 'react'
import { ReviewCard } from '@/components/dashboard/ReviewCard'
import { ResponseDraft } from '@/components/dashboard/ResponseDraft'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'

interface Review {
  id: string
  platform: string
  rating: number
  reviewText: string
  authorName: string
  reviewDate: string
  isDelivery: boolean
  response?: { id: string; draftText: string; status: string } | null
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [activeDrafts, setActiveDrafts] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ platform: '', rating: '' })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadReviews = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (filter.platform) params.set('platform', filter.platform)
    if (filter.rating) params.set('rating', filter.rating)
    const res = await fetch(`/api/reviews?${params}`)
    const data = await res.json()
    setReviews(data.reviews ?? [])
    setTotalPages(data.pages ?? 1)
    setLoading(false)
  }, [page, filter])

  useEffect(() => { loadReviews() }, [loadReviews])

  async function requestDraft(reviewId: string) {
    const res = await fetch('/api/ai/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId }),
    })
    const data = await res.json()
    if (data.error === 'UPGRADE_REQUIRED') {
      setToast({ message: 'Free plan: 3 AI drafts per month reached. Upgrade to continue.', type: 'error' })
      return
    }
    if (data.error === 'NO_VOICE_SAMPLES') {
      setToast({ message: 'Complete your voice setup before generating drafts.', type: 'error' })
      return
    }
    if (data.draft) {
      setActiveDrafts(prev => ({ ...prev, [reviewId]: data.draft }))
    } else if (!data.error) {
      setToast({ message: 'Could not generate draft. Please try again.', type: 'error' })
    }
  }

  async function approveDraft(reviewId: string, finalText: string) {
    const res = await fetch('/api/reviews/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, finalText, action: 'approve', postToGoogle: true }),
    })
    const data = await res.json()
    if (data.warning) setToast({ message: data.warning, type: 'error' })
    setActiveDrafts(prev => { const n = { ...prev }; delete n[reviewId]; return n })
    loadReviews()
  }

  async function dismissDraft(reviewId: string) {
    await fetch('/api/reviews/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, action: 'dismiss' }),
    })
    setActiveDrafts(prev => { const n = { ...prev }; delete n[reviewId]; return n })
    loadReviews()
  }

  async function syncReviews() {
    const res = await fetch('/api/reviews/fetch', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setToast({ message: data.error ?? 'Sync failed', type: 'error' })
      return
    }
    setToast({ message: `Synced ${data.synced} new, ${data.updated} updated`, type: 'success' })
    loadReviews()
  }

  const PLATFORMS = ['', 'GOOGLE', 'YELP', 'TRIPADVISOR', 'DOORDASH', 'UBEREATS', 'GRUBHUB']
  const RATINGS = ['', '1', '2', '3', '4', '5']

  return (
    <div className="p-8">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">Reviews</h1>
        <Button size="sm" variant="secondary" onClick={syncReviews}>Sync reviews</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {PLATFORMS.map(p => (
          <button
            key={p}
            onClick={() => { setPage(1); setFilter(f => ({ ...f, platform: p })) }}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${filter.platform === p ? 'bg-orange text-white border-orange' : 'bg-white border-border text-text-muted hover:border-orange hover:text-orange'}`}
          >
            {p || 'All platforms'}
          </button>
        ))}
        {RATINGS.map(r => (
          <button
            key={r}
            onClick={() => { setPage(1); setFilter(f => ({ ...f, rating: r })) }}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${filter.rating === r ? 'bg-orange text-white border-orange' : 'bg-white border-border text-text-muted hover:border-orange hover:text-orange'}`}
          >
            {r ? `${r}★` : 'All ratings'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl border border-border bg-white animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-text-muted text-sm">No reviews found. Connect Google in Settings and sync to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map(review => (
            <div key={review.id}>
              <ReviewCard review={review} onDraftRequest={requestDraft} />
              {activeDrafts[review.id] && (
                <div className="mt-2 ml-4">
                  <ResponseDraft
                    reviewId={review.id}
                    draft={activeDrafts[review.id]}
                    onApprove={approveDraft}
                    onDismiss={dismissDraft}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 mt-6">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <span className="text-sm text-text-muted self-center">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </div>
      )}
    </div>
  )
}
