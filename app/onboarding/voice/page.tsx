'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/onboarding/StepIndicator'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const SCENARIOS = [
  { type: 'positive_5star', label: 'Glowing 5-star review', review: 'Absolutely incredible. The pasta was handmade and the service was attentive without being overbearing. Best Italian in the city by far.' },
  { type: 'wait_complaint', label: 'Wait time complaint', review: 'Waited 45 minutes for food on a quiet Tuesday night. No explanation, no apology. Food was decent when it arrived but the wait killed the mood.' },
  { type: 'food_complaint', label: 'Food quality complaint', review: 'The risotto was undercooked and bland. For the price I expected a lot more. Kitchen needs to get its act together.' },
  { type: 'price_complaint', label: 'Price/value complaint', review: 'Good food but very overpriced for a casual neighbourhood place. $28 for a pasta dish is frankly excessive.' },
  { type: 'mixed', label: 'Mixed review', review: 'Great atmosphere and genuinely friendly staff. The tiramisu was the best I have had. Main course was a bit salty though — kitchen inconsistency.' },
]

export default function VoicePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const scenario = SCENARIOS[step]
  const completed = Object.keys(responses).length

  async function saveAndNext() {
    const text = responses[scenario.type]?.trim()
    if (text) {
      setSaving(true)
      await fetch('/api/onboarding/voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewType: scenario.type, sampleReview: scenario.review, ownerResponse: text }) })
      setSaving(false)
    }
    if (step < SCENARIOS.length - 1) setStep(s => s + 1)
    else router.push('/onboarding/plan')
  }

  function skipScenario() {
    if (step < SCENARIOS.length - 1) setStep(s => s + 1)
    else router.push('/onboarding/plan')
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 flex justify-center"><StepIndicator currentStep={3} /></div>
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-charcoal">Train your voice</h1>
          <span className="text-xs text-text-lighter">{completed} of {SCENARIOS.length} complete</span>
        </div>
        <p className="mb-6 text-sm text-text-muted">How would you reply to this review? Write naturally — Stir will match your style.</p>
        <div className="mb-5 rounded-lg bg-warm-gray p-4 border border-border">
          <p className="text-xs font-medium text-text-lighter mb-2 uppercase tracking-wide">{scenario.label}</p>
          <p className="text-sm text-charcoal italic">&quot;{scenario.review}&quot;</p>
        </div>
        <div className="mb-5">
          <label className="text-sm font-medium text-charcoal mb-1.5 block">Your response</label>
          <textarea rows={4} placeholder="Write your response..." value={responses[scenario.type] || ''} onChange={e => setResponses(p => ({ ...p, [scenario.type]: e.target.value }))} className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-charcoal placeholder:text-text-lighter focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20" />
        </div>
        {step === SCENARIOS.length - 1 && completed === SCENARIOS.length && (
          <p className="mb-4 text-sm text-green font-medium">Your voice is set — Stir will write like you from now on.</p>
        )}
        <div className="flex gap-3">
          <Button size="lg" className="flex-1" onClick={saveAndNext} disabled={saving}>{step < SCENARIOS.length - 1 ? 'Save & next →' : 'Finish →'}</Button>
          <Button variant="ghost" size="lg" onClick={skipScenario}>Skip</Button>
        </div>
      </Card>
    </div>
  )
}
