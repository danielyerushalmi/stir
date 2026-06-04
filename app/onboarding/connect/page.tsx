'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/onboarding/StepIndicator'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const PLATFORMS = [
  { id: 'GOOGLE', label: 'Google', icon: '🔵', required: true },
  { id: 'YELP', label: 'Yelp', icon: '🔴' },
  { id: 'TRIPADVISOR', label: 'TripAdvisor', icon: '🟢' },
  { id: 'DOORDASH', label: 'DoorDash', icon: '🛵', comingSoon: true },
  { id: 'UBEREATS', label: 'Uber Eats', icon: '🚗', comingSoon: true },
  { id: 'GRUBHUB', label: 'Grubhub', icon: '🟠', comingSoon: true },
]

export default function ConnectStep() {
  const router = useRouter()
  const [connected, setConnected] = useState<Set<string>>(new Set())
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const connectedParam = params.get('connected')
    if (connectedParam) setConnected(new Set([connectedParam]))
    const errorParam = params.get('error')
    if (errorParam === 'google_no_location') {
      setError('No Google Business location found on that account. Make sure you manage a verified location.')
    } else if (errorParam === 'google_denied') {
      setError('Google connection was cancelled.')
    } else if (errorParam === 'google_failed') {
      setError('Google connection failed. Please try again.')
    }
  }, [])

  function connectGoogle() {
    const returnTo = encodeURIComponent('/onboarding/connect?connected=GOOGLE')
    window.location.href = `/api/auth/google?returnTo=${returnTo}`
  }

  async function connectManual(platformId: string, externalId?: string) {
    await fetch('/api/onboarding/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: platformId, externalId }),
    })
    setConnected(prev => new Set(prev).add(platformId))
  }

  async function handleContinue() {
    if (!connected.has('GOOGLE')) { setError('Please connect Google to continue.'); return }
    setLoading(true)
    try {
      router.push('/onboarding/voice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 flex justify-center"><StepIndicator currentStep={2} /></div>
      <Card>
        <h1 className="mb-1 text-xl font-semibold text-charcoal">Connect your review platforms</h1>
        <p className="mb-6 text-sm text-text-muted">All your reviews, one place.</p>
        <div className="flex flex-col gap-3 mb-6">
          {PLATFORMS.map(p => (
            <div
              key={p.id}
              className={cn(
                'flex items-center justify-between rounded-lg border p-4',
                connected.has(p.id) ? 'border-green bg-green-light' : 'border-border bg-white',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{p.icon}</span>
                <span className="font-medium text-charcoal text-sm">{p.label}</span>
                {p.required && <Badge variant="orange">Required</Badge>}
                {p.comingSoon && <Badge variant="gray">Coming soon</Badge>}
              </div>
              {!p.comingSoon && (
                connected.has(p.id)
                  ? <span className="text-xs text-green font-medium">✓ Connected</span>
                  : p.id === 'GOOGLE'
                    ? <Button size="sm" onClick={connectGoogle}>Connect with Google</Button>
                    : <div className="flex gap-2">
                        <input
                          className="rounded border border-border px-3 py-1.5 text-xs w-44"
                          placeholder="Paste listing URL"
                          aria-label="Listing URL"
                          value={inputs[p.id] || ''}
                          onChange={e => setInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                        />
                        <Button size="sm" onClick={() => connectManual(p.id, inputs[p.id])}>Save</Button>
                      </div>
              )}
            </div>
          ))}
        </div>
        {error && <p className="mb-4 text-sm text-red-dark">{error}</p>}
        <Button size="lg" className="w-full" onClick={handleContinue} disabled={loading}>
          Continue →
        </Button>
        <button
          className="mt-3 w-full text-center text-sm text-text-lighter hover:text-orange"
          onClick={() => router.push('/onboarding/voice')}
        >
          Skip for now
        </button>
      </Card>
    </div>
  )
}
