'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Insight {
  id: string
  type: 'ALERT' | 'TIP' | 'DELIVERY_GAP'
  title: string
  body: string
  reviewCount: number
  platforms: string[]
  isRead: boolean
}

const TYPE_META = {
  ALERT: { label: 'Alert', variant: 'red' as const },
  TIP: { label: 'Tip', variant: 'orange' as const },
  DELIVERY_GAP: { label: 'Delivery', variant: 'amber' as const },
}

const FILTER_OPTIONS = ['ALL', 'ALERT', 'TIP', 'DELIVERY_GAP'] as const
type FilterOption = typeof FILTER_OPTIONS[number]

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterOption>('ALL')

  async function loadInsights() {
    const res = await fetch('/api/insights')
    const data = await res.json()
    setInsights(data.insights ?? [])
  }

  useEffect(() => { loadInsights() }, [])

  async function generate() {
    setGenerating(true)
    setError('')
    const res = await fetch('/api/ai/insights', { method: 'POST' })
    const data = await res.json()
    if (res.ok) setInsights(data.insights ?? [])
    else setError(data.error ?? 'Something went wrong')
    setGenerating(false)
  }

  async function markRead(id: string) {
    await fetch(`/api/insights/${id}/read`, { method: 'POST' })
    setInsights(prev => prev.map(i => i.id === id ? { ...i, isRead: true } : i))
  }

  const filtered = filter === 'ALL' ? insights : insights.filter(i => i.type === filter)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">Insights</h1>
        <Button size="sm" onClick={generate} disabled={generating}>
          {generating ? 'Generating...' : 'Regenerate insights'}
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-dark">{error}</p>}

      <div className="flex gap-2 mb-5">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${filter === f ? 'bg-orange text-white border-orange' : 'bg-white border-border text-text-muted hover:border-orange hover:text-orange'}`}
          >
            {f === 'ALL' ? 'All' : f === 'DELIVERY_GAP' ? 'Delivery' : TYPE_META[f].label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-text-muted text-sm mb-4">
            {insights.length === 0 ? 'No insights yet.' : 'No insights match this filter.'}
          </p>
          {insights.length === 0 && (
            <Button onClick={generate} disabled={generating}>
              {generating ? 'Generating...' : 'Generate insights'}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(insight => (
            <div
              key={insight.id}
              className={`rounded-xl border border-border bg-white p-5 ${insight.isRead ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={TYPE_META[insight.type].variant}>{TYPE_META[insight.type].label}</Badge>
                    <span className="text-xs text-text-lighter">
                      {insight.reviewCount} reviews · {insight.platforms.join(', ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-charcoal mb-1">{insight.title}</h3>
                  <p className="text-sm text-text-muted">{insight.body}</p>
                </div>
                {!insight.isRead && (
                  <button
                    className="text-xs text-text-lighter hover:text-orange shrink-0"
                    onClick={() => markRead(insight.id)}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
