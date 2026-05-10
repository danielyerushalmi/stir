'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/onboarding/StepIndicator'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const PLATFORMS = [
  { id: 'GOOGLE', label: 'Google', icon: '🔵', mock: true, required: true },
  { id: 'YELP', label: 'Yelp', icon: '🔴', mock: false },
  { id: 'TRIPADVISOR', label: 'TripAdvisor', icon: '🟢', mock: false },
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

  async function connect(platformId: string, externalId?: string) {
    await fetch('/api/onboarding/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: platformId, externalId }) })
    setConnected(prev => new Set(prev).add(platformId))
  }

  async function handleContinue() {
    if (!connected.has('GOOGLE')) { setError('Please connect Google to continue.'); return }
    setLoading(true)
    router.push('/onboarding/voice')
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 flex justify-center"><StepIndicator currentStep={2} /></div>
      <Card>
        <h1 className="mb-1 text-xl font-semibold text-charcoal">Connect your review platforms</h1>
        <p className="mb-6 text-sm text-text-muted">All your reviews, one place.</p>
        <div className="flex flex-col gap-3 mb-6">
          {PLATFORMS.map(p => (
            <div key={p.id} className={cn('flex items-center justify-between rounded-lg border p-4', connected.has(p.id) ? 'border-green bg-green-light' : 'border-border bg-white')}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{p.icon}</span>
                <span className="font-medium text-charcoal text-sm">{p.label}</span>
                {p.required && <Badge variant="orange">Required</Badge>}
                {p.comingSoon && <Badge variant="gray">Coming soon</Badge>}
              </div>
              {!p.comingSoon && (
                connected.has(p.id)
                  ? <span className="text-xs text-green font-medium">✓ Connected</span>
                  : p.mock
                    ? <Button size="sm" onClick={() => connect(p.id)}>Connect</Button>
                    : <div className="flex gap-2">
                        <input className="rounded border border-border px-3 py-1.5 text-xs w-44" placeholder="Paste listing URL" value={inputs[p.id] || ''} onChange={e => setInputs(prev => ({ ...prev, [p.id]: e.target.value }))} />
                        <Button size="sm" onClick={() => connect(p.id, inputs[p.id])}>Save</Button>
                      </div>
              )}
            </div>
          ))}
        </div>
        {error && <p className="mb-4 text-sm text-red-dark">{error}</p>}
        <Button size="lg" className="w-full" onClick={handleContinue} disabled={loading}>Continue →</Button>
        <button className="mt-3 w-full text-center text-sm text-text-lighter hover:text-orange" onClick={async () => { await connect('GOOGLE'); router.push('/onboarding/voice') }}>Skip for now</button>
      </Card>
    </div>
  )
}
