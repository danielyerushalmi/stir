'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/onboarding/StepIndicator'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const PLANS = [
  { id: 'FREE', label: 'Free', price: '$0', features: ['3 AI drafts / month', '1 platform', 'Basic insights'], highlight: false },
  { id: 'STARTER', label: 'Starter', price: '$29/mo', features: ['50 AI drafts / month', '3 platforms', 'Full insights', 'Response posting'], highlight: true },
  { id: 'GROWTH', label: 'Growth', price: '$79/mo', features: ['Unlimited drafts', 'All platforms', 'Competitor tracking', 'Weekly reports'], highlight: false },
]

export default function PlanPage() {
  const router = useRouter()
  const [selected, setSelected] = useState('FREE')

  function handleSelect(planId: string) {
    if (planId === 'FREE') router.push('/dashboard')
    else router.push(`/dashboard?upgrade=${planId}`)
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8 flex justify-center"><StepIndicator currentStep={4} /></div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-charcoal mb-2">Choose your plan</h1>
        <p className="text-text-muted text-sm">You can upgrade at any time from your dashboard.</p>
      </div>
      <div role="radiogroup" aria-label="Choose your plan" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map(plan => (
          <Card
            key={plan.id}
            role="radio"
            aria-checked={selected === plan.id}
            aria-label={`${plan.label}, ${plan.price}`}
            tabIndex={0}
            onClick={() => setSelected(plan.id)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSelected(plan.id)
              }
            }}
            className={cn(
              'cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange',
              plan.highlight && 'border-orange ring-2 ring-orange/20',
              selected === plan.id && 'shadow-md',
            )}
          >
            {plan.highlight && <Badge variant="orange" className="mb-3">Most popular</Badge>}
            <div className="mb-1 font-semibold text-charcoal">{plan.label}</div>
            <div className="mb-4 text-2xl font-semibold text-orange">{plan.price}</div>
            <ul className="flex flex-col gap-2 mb-6">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                  <span className="text-green" aria-hidden="true">✓</span>{f}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.highlight ? 'primary' : 'secondary'}
              size="sm"
              className="w-full"
              onClick={e => { e.stopPropagation(); handleSelect(plan.id) }}
            >
              {plan.id === 'FREE' ? 'Start free' : 'Coming soon'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
