'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface RestaurantData {
  name: string
  cuisineType: string
  city: string
  vibe: string
}

interface RestaurantTabProps {
  restaurant: RestaurantData
  onToast: (message: string, type: 'success' | 'error') => void
}

export function RestaurantTab({ restaurant, onToast }: RestaurantTabProps) {
  const [form, setForm] = useState(restaurant)
  const [saving, setSaving] = useState(false)

  function set(field: keyof RestaurantData, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/restaurant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      onToast('Restaurant updated', 'success')
    } catch {
      onToast('Failed to save changes', 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-border bg-cream px-4 py-2.5 text-sm text-charcoal placeholder:text-text-lighter focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20'
  const labelClass = 'block text-xs font-medium uppercase tracking-wide text-text-lighter mb-1.5'

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-charcoal">Restaurant info</h2>
      <p className="mb-5 text-xs text-text-lighter">This information helps Stir personalise your AI responses.</p>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Restaurant name</label>
          <input className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Cuisine type</label>
          <input className={inputClass} value={form.cuisineType} onChange={e => set('cuisineType', e.target.value)} />
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass}>City</label>
        <input className={inputClass} value={form.city} onChange={e => set('city', e.target.value)} />
      </div>

      <div className="mb-5">
        <label className={labelClass}>Vibe &amp; description</label>
        <textarea
          className={`${inputClass} min-h-[88px] resize-y`}
          value={form.vibe}
          onChange={e => set('vibe', e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </Card>
  )
}
