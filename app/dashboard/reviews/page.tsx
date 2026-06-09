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
  const [draftingIds, setDraftingIds] = useState<Set<string>>(new Set())
  const [syncing, setSyncing] = useState(false)

  const loadReviews = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (filter.platform) params.set('platform', filter.platform)
    if (filter.rating) params.set('rating', filter.rating)
    try {
      const res = await fetch(`/api/reviews?${params}`, { signal })
      if (!res.ok) { setToast({ message: 'Failed to load reviews. Please try again.', type: 'error' }); setLoading(false); return }
      const data = await res.json()
      setReviews(data.reviews ?? [])
      setTotalPages(data.pages ?? 1)
      setLoading(false)
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return
      setToast({ message: 'Failed to load reviews. Please try again.', type: 'error' })
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => {
    const controller = new AbortController()
    loadReviews(controller.signal)
    return () => controller.abort()
  }, [loadReviews])

  async function requestDraft(reviewId: string) {
    if (draftingIds.has(reviewId)) return
    setDraftingIds(prev => new Set(prev).add(reviewId))
    try {
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.error === 'UPGRADE_REQUIRED') {
        setToast({ message: 'Free plan: 3 AI drafts per month reached. Upgrade to continue.', type: 'error' })
        return
      }
      if (data.error === 'NO_VOICE_SAMPLES') {
        setToast({ message: 'Complete your voice setup before generating drafts.', type: 'error' })
        return
      }
      if (!res.ok) {
        setToast({ message: 'Could not generate draft. Please try again.', type: 'error' })
        return
      }
      if (data.draft) {
        setActiveDrafts(prev => ({ ...prev, [reviewId]: data.draft }))
      } else if (!data.error) {
        setToast({ message: 'Could not generate draft. Please try again.', type: 'error' })
      }
    } catch {
      setToast({ message: 'Could not generate draft. Please try again.', type: 'error' })
    } finally {
      setDraftingIds(prev => { const n = new Set(prev); n.delete(reviewId); return n })
    }
  }

  async function approveDraft(reviewId: string, finalText: string) {
    try {
      const res = await fetch('/api/reviews/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, finalText, action: 'approve', postToGoogle: true }),
      })
      if (!res.ok) { setToast({ message: 'Failed to post response. Please try again.', type: 'error' }); return }
      const data = await res.json().catch(() => ({}))
      if (data.warning) {
        // DB saved but Google posting failed — surface warning and reflect a saved-not-posted state.
        setToast({ message: data.warning, type: 'error' })
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, response: { id: '', draftText: finalText, status: 'DRAFT' } } : r))
      } else {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, response: { id: '', draftText: finalText, status: 'POSTED' } } : r))
      }
      setActiveDrafts(prev => { const n = { ...prev }; delete n[reviewId]; return n })
    } catch {
      setToast({ message: 'Failed to post response. Please try again.', type: 'error' })
    }
  }

  async function dismissDraft(reviewId: string) {
    const res = await fetch('/api/reviews/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, action: 'dismiss' }),
    })
    if (!res.ok) { setToast({ message: 'Failed to dismiss draft. Please try again.', type: 'error' }); return }
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, response: null } : r))
    setActiveDrafts(prev => { const n = { ...prev }; delete n[reviewId]; return n })
  }

  async function syncReviews() {
    if (syncing) return
    setSyncing(true)
    try {
      const res = await fetch('/api/reviews/fetch', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setToast({ message: data.error ?? 'Sync failed', type: 'error' })
        return
      }
      setToast({ message: `Synced ${data.synced} new, ${data.updated} updated`, type: 'success' })
      loadReviews()
    } catch {
      setToast({ message: 'Sync failed', type: 'error' })
    } finally {
      setSyncing(false)
    }
  }

  const PLATFORMS = ['', 'GOOGLE', 'YELP', 'TRIPADVISOR', 'DOORDASH', 'UBEREATS', 'GRUBHUB']
  const RATINGS = ['', '1', '2', '3', '4', '5']

  return (
    <div className="p-4 md:p-8">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charcoal tracking-tight">Reviews</h1>
        <Button size="sm" variant="secondary" onClick={syncReviews} disabled={syncing}>{syncing ? 'Syncing…' : 'Sync reviews'}</Button>
      </div>

      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <span className="text-xs font-medium text-text-muted">Quick:</span>
        <button
          onClick={() => { setPage(1); setFilter({ platform: '', rating: '1' }) }}
          className="rounded-full px-3 py-1 text-xs font-medium border transition-colors bg-red-light text-red-dark border-red-dark/30 hover:bg-red-dark hover:text-white flex-shrink-0 min-h-[36px] flex items-center"
        >
          🚨 1★ urgent
        </button>
        <button
          onClick={() => { setPage(1); setFilter({ platform: '', rating: '' }); }}
          className="rounded-full px-3 py-1 text-xs font-medium border border-border text-text-muted hover:border-orange hover:text-orange transition-colors flex-shrink-0 min-h-[36px] flex items-center"
        >
          Clear filters
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {PLATFORMS.map(p => (
          <button
            key={p}
            onClick={() => { setPage(1); setFilter(f => ({ ...f, platform: p })) }}
            aria-pressed={filter.platform === p}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors flex-shrink-0 min-h-[44px] flex items-center ${filter.platform === p ? 'bg-orange text-white border-orange' : 'bg-white border-border text-text-muted hover:border-orange hover:text-orange'}`}
          >
            {p || 'All platforms'}
          </button>
        ))}
        {RATINGS.map(r => (
          <button
            key={r}
            onClick={() => { setPage(1); setFilter(f => ({ ...f, rating: r })) }}
            aria-pressed={filter.rating === r}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors flex-shrink-0 min-h-[44px] flex items-center ${filter.rating === r ? 'bg-orange text-white border-orange' : 'bg-white border-border text-text-muted hover:border-orange hover:text-orange'}`}
          >
            {r ? `${r}★` : 'All ratings'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-border border-l-4 border-l-border bg-white p-4 animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-14 rounded-full bg-border" />
                <div className="h-3 w-20 rounded bg-border" />
              </div>
              <div className="h-3 w-24 rounded bg-border mb-1" />
              <div className="h-3 w-full rounded bg-border mb-1" />
              <div className="h-3 w-3/4 rounded bg-border mb-3" />
              <div className="h-8 w-24 rounded-lg bg-border" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        filter.platform === '' && filter.rating === '' ? (
          <div className="rounded-xl border border-border bg-white p-10 text-center">
            <div className="text-4xl mb-4" aria-hidden="true">⭐</div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">No reviews yet</h3>
            <p className="text-sm text-text-muted mb-5">Connect your Google account to start pulling in reviews.</p>
            <a href="/dashboard/settings?tab=platforms" className="inline-flex items-center rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-dark transition-colors">
              Connect Google →
            </a>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-white p-8 text-center">
            <p className="text-text-muted text-sm">No reviews match this filter.</p>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map(review => (
            <div key={review.id}>
              <ReviewCard review={review} onDraftRequest={requestDraft} drafting={draftingIds.has(review.id)} />
              {activeDrafts[review.id] && (
                <div className="mt-2 ml-4">
                  <ResponseDraft
                    reviewId={review.id}
                    draft={activeDrafts[review.id]}
                    platform={review.platform}
                    onApprove={approveDraft}
                    onDismiss={dismissDraft}
                    onRegenerate={() => requestDraft(review.id)}
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
