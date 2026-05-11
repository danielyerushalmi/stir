'use client'
import { useState } from 'react'
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
}

const PLATFORM_META: Record<string, { label: string; emoji: string; bg: string }> = {
  GOOGLE:      { label: 'Google Business', emoji: 'G', bg: 'bg-blue-50' },
  YELP:        { label: 'Yelp',            emoji: 'Y', bg: 'bg-orange-light' },
  TRIPADVISOR: { label: 'TripAdvisor',     emoji: 'T', bg: 'bg-green-light' },
  FACEBOOK:    { label: 'Facebook',        emoji: 'F', bg: 'bg-blue-50' },
}

const ALL_PLATFORMS = ['GOOGLE', 'YELP', 'TRIPADVISOR', 'FACEBOOK']

function formatSync(ts: string | null): string {
  if (!ts) return 'Never synced'
  const diff = Date.now() - new Date(ts).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Synced recently'
  if (h < 24) return `Synced ${h}h ago`
  const d = Math.floor(h / 24)
  return `Synced ${d}d ago`
}

export function PlatformsTab({ platforms: initial, onToast }: PlatformsTabProps) {
  const [platforms, setPlatforms] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)

  function getState(name: string): PlatformData {
    return platforms.find(p => p.name === name) ?? { name, isConnected: false, lastSyncedAt: null }
  }

  async function toggle(name: string, isConnected: boolean) {
    setBusy(name)
    try {
      if (isConnected) {
        const res = await fetch(`/api/settings/platforms/${name}`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
        setPlatforms(prev => prev.map(p => p.name === name ? { ...p, isConnected: false } : p))
        onToast(`${PLATFORM_META[name]?.label ?? name} disconnected`, 'success')
      } else {
        const res = await fetch('/api/settings/platforms/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: name }),
        })
        if (!res.ok) throw new Error()
        setPlatforms(prev => {
          const exists = prev.find(p => p.name === name)
          if (exists) return prev.map(p => p.name === name ? { ...p, isConnected: true } : p)
          return [...prev, { name, isConnected: true, lastSyncedAt: null }]
        })
        onToast(`${PLATFORM_META[name]?.label ?? name} connected`, 'success')
      }
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
        {ALL_PLATFORMS.map(name => {
          const p = getState(name)
          const meta = PLATFORM_META[name]
          return (
            <div key={name} className="flex items-center gap-3 py-3">
              <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-charcoal', meta.bg)}>
                {meta.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal">{meta.label}</p>
                <p className="text-xs text-text-lighter">{formatSync(p.lastSyncedAt)}</p>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  p.isConnected ? 'bg-green-light text-green' : 'bg-border text-text-lighter'
                )}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', p.isConnected ? 'bg-green' : 'bg-text-lighter')} />
                  {p.isConnected ? 'Connected' : 'Disconnected'}
                </span>
                <Button
                  variant={p.isConnected ? 'secondary' : 'primary'}
                  size="sm"
                  disabled={busy === name}
                  onClick={() => toggle(name, p.isConnected)}
                >
                  {busy === name ? '…' : p.isConnected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
