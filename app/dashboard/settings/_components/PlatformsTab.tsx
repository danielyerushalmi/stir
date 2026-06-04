'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface PlatformData {
  name: string
  isConnected: boolean
  lastSyncedAt: string | null
}

interface PlatformsTabProps {
  platforms: PlatformData[]
  onToast: (message: string, type: 'success' | 'error') => void
  yelpAvailable: boolean
  yelpData?: { rating: number; reviewCount: number }
}

const COMING_SOON = [
  { label: 'TripAdvisor', emoji: 'T', bg: 'bg-green-light' },
  { label: 'Facebook',    emoji: 'F', bg: 'bg-blue-50' },
  { label: 'DoorDash',    emoji: 'D', bg: 'bg-red-50' },
  { label: 'Uber Eats',   emoji: 'U', bg: 'bg-green-light' },
  { label: 'Grubhub',     emoji: 'G', bg: 'bg-orange-light' },
]

const ERROR_MESSAGES: Record<string, string> = {
  google_denied: 'Google connection was cancelled.',
  google_no_location: 'No Google Business location found on that account.',
  google_failed: 'Google connection failed. Please try again.',
}

function formatSync(ts: string | null): string {
  if (!ts) return 'Never synced'
  const diff = Date.now() - new Date(ts).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Synced recently'
  if (h < 24) return `Synced ${h}h ago`
  return `Synced ${Math.floor(h / 24)}d ago`
}

export function PlatformsTab({ platforms: initial, onToast, yelpAvailable, yelpData }: PlatformsTabProps) {
  const [platforms, setPlatforms] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [yelpConnected, setYelpConnected] = useState<{ rating: number; reviewCount: number } | null>(yelpData ?? null)
  const [yelpForm, setYelpForm] = useState({ businessName: '', city: '' })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    if (errorParam && ERROR_MESSAGES[errorParam]) {
      onToast(ERROR_MESSAGES[errorParam], 'error')
    }
  }, [onToast])

  const google = platforms.find(p => p.name === 'GOOGLE') ?? { name: 'GOOGLE', isConnected: false, lastSyncedAt: null }

  async function connectGoogle() {
    const returnTo = encodeURIComponent('/dashboard/settings?tab=platforms')
    window.location.href = `/api/auth/google?returnTo=${returnTo}`
  }

  async function disconnectGoogle() {
    setBusy('GOOGLE')
    try {
      const res = await fetch('/api/settings/platforms/GOOGLE', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setPlatforms(prev => prev.map(p => p.name === 'GOOGLE' ? { ...p, isConnected: false } : p))
      onToast('Google Business disconnected', 'success')
    } catch {
      onToast('Something went wrong', 'error')
    } finally {
      setBusy(null)
    }
  }

  async function connectYelp() {
    const businessName = yelpForm.businessName.trim()
    const city = yelpForm.city.trim()
    if (!businessName || !city) {
      onToast('Enter business name and city', 'error')
      return
    }
    setBusy('YELP')
    try {
      const res = await fetch('/api/platforms/yelp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, location: city }),
      })
      const data = await res.json()
      if (!res.ok) {
        onToast(data.error ?? 'Yelp connection failed', 'error')
        return
      }
      setYelpConnected({ rating: data.rating, reviewCount: data.reviewCount })
      setYelpForm({ businessName: '', city: '' })
      onToast('Yelp connected', 'success')
    } catch {
      onToast('Something went wrong', 'error')
    } finally {
      setBusy(null)
    }
  }

  async function disconnectYelp() {
    setBusy('YELP')
    try {
      const res = await fetch('/api/settings/platforms/YELP', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setYelpConnected(null)
      onToast('Yelp disconnected', 'success')
    } catch {
      onToast('Something went wrong', 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-charcoal">Connected platforms</h2>
      <p className="mb-5 text-xs text-text-lighter">Manage which review platforms Stir syncs with.</p>

      <div className="flex flex-col divide-y divide-border">
        {/* Google — the only live integration */}
        <div className="flex items-center gap-3 py-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-charcoal bg-blue-50">
            G
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-charcoal">Google Business</p>
            <p className="text-xs text-text-lighter">{formatSync(google.lastSyncedAt)}</p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
              google.isConnected ? 'bg-green-light text-green' : 'bg-border text-text-lighter',
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-full', google.isConnected ? 'bg-green' : 'bg-text-lighter')} />
              {google.isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <Button
              variant={google.isConnected ? 'secondary' : 'primary'}
              size="sm"
              disabled={busy === 'GOOGLE'}
              onClick={google.isConnected ? disconnectGoogle : connectGoogle}
            >
              {busy === 'GOOGLE' ? '…' : google.isConnected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        </div>

        {/* Yelp — real API, only shown as connectable when API key is configured */}
        {yelpAvailable ? (
          yelpConnected ? (
            <div className="flex items-center gap-3 py-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-charcoal bg-orange-light">
                Y
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal">Yelp</p>
                <p className="text-xs text-text-lighter">
                  {yelpConnected.rating.toFixed(1)} ★ · {yelpConnected.reviewCount.toLocaleString()} reviews
                </p>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-light text-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-green" />
                  Connected
                </span>
                <Button variant="secondary" size="sm" disabled={busy === 'YELP'} onClick={disconnectYelp}>
                  {busy === 'YELP' ? '…' : 'Disconnect'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-charcoal bg-orange-light">
                  Y
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal">Yelp</p>
                  <p className="text-xs text-text-lighter">Connect to import reviews and aggregate rating</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-border text-text-lighter">
                  <span className="h-1.5 w-1.5 rounded-full bg-text-lighter" />
                  Disconnected
                </span>
              </div>
              <div className="flex gap-2 ml-12">
                <input
                  type="text"
                  placeholder="Restaurant name"
                  aria-label="Restaurant name"
                  value={yelpForm.businessName}
                  onChange={e => setYelpForm(f => ({ ...f, businessName: e.target.value }))}
                  className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-orange/20"
                />
                <input
                  type="text"
                  placeholder="City"
                  aria-label="City"
                  value={yelpForm.city}
                  onChange={e => setYelpForm(f => ({ ...f, city: e.target.value }))}
                  className="w-32 rounded-lg border border-border px-3 py-1.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-orange/20"
                />
                <Button size="sm" disabled={busy === 'YELP'} onClick={connectYelp}>
                  {busy === 'YELP' ? '…' : 'Connect'}
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center gap-3 py-3 opacity-50 cursor-not-allowed">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-charcoal bg-orange-light">
              Y
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal">Yelp</p>
              <p className="text-xs text-text-lighter">Not yet available</p>
            </div>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-border text-text-lighter">
              Coming soon
            </span>
          </div>
        )}

        {/* Coming Soon — no real API available for these platforms */}
        {COMING_SOON.map(({ label, emoji, bg }) => (
          <div key={label} className="flex items-center gap-3 py-3 opacity-40 cursor-not-allowed">
            <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-charcoal', bg)}>
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal">{label}</p>
            </div>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-border text-text-lighter">
              Coming soon
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
