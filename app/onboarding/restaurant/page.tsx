'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/onboarding/StepIndicator'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const CUISINE_TYPES = ['Italian', 'Mexican', 'American', 'Japanese', 'Indian', 'Chinese', 'French', 'Mediterranean', 'Thai', 'Other']

export default function RestaurantStep() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', cuisineType: '', city: '', vibe: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Restaurant name is required'
    if (!form.cuisineType) e.cuisineType = 'Select a cuisine type'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.vibe.trim()) e.vibe = 'Tell us about your vibe'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    const res = await fetch('/api/onboarding/restaurant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) router.push('/onboarding/connect')
    else if (res.status === 429) setErrors({ submit: 'Too many attempts — please wait a minute and try again.' })
    else setErrors({ submit: 'Something went wrong. Try again.' })
    setLoading(false)
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 flex justify-center">
        <StepIndicator currentStep={1} />
      </div>
      <Card>
        <h1 className="mb-1 text-xl font-semibold text-charcoal">Tell us about your restaurant</h1>
        <p className="mb-6 text-sm text-text-muted">This helps Stir personalise your responses.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="name" label="Restaurant name" placeholder="The Corner Table" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} error={errors.name} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cuisineType" className="text-sm font-medium text-charcoal">Cuisine type</label>
            <select id="cuisineType" value={form.cuisineType} onChange={e => setForm(p => ({ ...p, cuisineType: e.target.value }))} className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-charcoal focus:border-orange focus:outline-none">
              <option value="">Select cuisine</option>
              {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.cuisineType && <p className="text-xs text-red-dark">{errors.cuisineType}</p>}
          </div>
          <Input id="city" label="City" placeholder="Austin, TX" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} error={errors.city} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="vibe" className="text-sm font-medium text-charcoal">Vibe & personality</label>
            <textarea id="vibe" rows={3} placeholder="e.g. We're a neighbourhood spot — warm, casual, regulars know us by name" value={form.vibe} onChange={e => setForm(p => ({ ...p, vibe: e.target.value }))} className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-text-lighter focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20" />
            {errors.vibe && <p className="text-xs text-red-dark">{errors.vibe}</p>}
          </div>
          {errors.submit && <p className="text-sm text-red-dark">{errors.submit}</p>}
          <Button type="submit" size="lg" disabled={loading}>{loading ? 'Saving...' : 'Continue →'}</Button>
        </form>
      </Card>
    </div>
  )
}
