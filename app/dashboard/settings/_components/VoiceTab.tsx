'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface VoiceSample {
  id: string
  reviewType: string
  sampleReview: string
  ownerResponse: string
}

interface VoiceTabProps {
  voiceSamples: VoiceSample[]
  onToast: (message: string, type: 'success' | 'error') => void
}

const TYPE_OPTIONS = [
  'positive_5star',
  'wait_complaint',
  'food_complaint',
  'price_complaint',
  'service_complaint',
  'mixed',
]

const TYPE_LABELS: Record<string, string> = {
  positive_5star: 'Positive (5★)',
  wait_complaint: 'Wait complaint',
  food_complaint: 'Food complaint',
  price_complaint: 'Price complaint',
  service_complaint: 'Service complaint',
  mixed: 'Mixed',
}

const TYPE_VARIANT: Record<string, 'green' | 'red' | 'amber' | 'gray'> = {
  positive_5star: 'green',
  wait_complaint: 'red',
  food_complaint: 'red',
  price_complaint: 'amber',
  service_complaint: 'red',
  mixed: 'gray',
}

const EMPTY_FORM = { reviewType: 'positive_5star', sampleReview: '', ownerResponse: '' }

const textareaClass = 'w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm text-charcoal placeholder:text-text-lighter focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 resize-y min-h-[72px]'
const labelClass = 'block text-xs font-medium uppercase tracking-wide text-text-lighter mb-1'

export function VoiceTab({ voiceSamples: initial, onToast }: VoiceTabProps) {
  const [samples, setSamples] = useState(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  function startEdit(s: VoiceSample) {
    setEditingId(s.id)
    setEditForm({ reviewType: s.reviewType, sampleReview: s.sampleReview, ownerResponse: s.ownerResponse })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/settings/voice/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error()
      const { sample } = await res.json()
      setSamples(prev => prev.map(s => s.id === id ? sample : s))
      setEditingId(null)
      onToast('Sample updated', 'success')
    } catch {
      onToast('Failed to save sample', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSample(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/settings/voice/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setSamples(prev => prev.filter(s => s.id !== id))
      setDeletingId(null)
      onToast('Sample deleted', 'success')
    } catch {
      onToast('Failed to delete sample', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function addSample() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      if (!res.ok) throw new Error()
      const { sample } = await res.json()
      setSamples(prev => [...prev, sample])
      setAddForm(EMPTY_FORM)
      setShowAddForm(false)
      onToast('Sample added', 'success')
    } catch {
      onToast('Failed to add sample', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-charcoal">Voice samples</h2>
      <p className="mb-5 text-xs text-text-lighter">
        Stir uses these to match your writing style when generating drafts. More examples = better results.
      </p>

      <div className="flex flex-col gap-3 mb-4">
        {samples.length === 0 && !showAddForm && (
          <p className="text-sm text-text-lighter py-2">No samples yet. Add one below to unlock AI draft generation.</p>
        )}

        {samples.map(s => (
          <div key={s.id} className="rounded-xl border border-border bg-cream p-4">
            {editingId === s.id ? (
              <div>
                <div className="mb-3">
                  <label className={labelClass}>Review type</label>
                  <select
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-charcoal focus:border-orange focus:outline-none"
                    value={editForm.reviewType}
                    onChange={e => setEditForm(f => ({ ...f, reviewType: e.target.value }))}
                  >
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className={labelClass}>Customer review</label>
                  <textarea className={textareaClass} value={editForm.sampleReview} onChange={e => setEditForm(f => ({ ...f, sampleReview: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className={labelClass}>Your response</label>
                  <textarea className={textareaClass} value={editForm.ownerResponse} onChange={e => setEditForm(f => ({ ...f, ownerResponse: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                  <Button size="sm" disabled={saving} onClick={() => saveEdit(s.id)}>{saving ? 'Saving…' : 'Save'}</Button>
                </div>
              </div>
            ) : deletingId === s.id ? (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-charcoal">Delete this sample? This cannot be undone.</p>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
                  <Button
                    size="sm"
                    className="bg-red-dark hover:bg-red-dark/90 text-white"
                    disabled={saving}
                    onClick={() => deleteSample(s.id)}
                  >
                    {saving ? '…' : 'Delete'}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant={TYPE_VARIANT[s.reviewType] ?? 'gray'}>
                    {TYPE_LABELS[s.reviewType] ?? s.reviewType}
                  </Badge>
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-lighter mb-0.5">Customer review</p>
                <p className="text-sm text-charcoal mb-3 leading-relaxed">&ldquo;{s.sampleReview}&rdquo;</p>
                <p className="text-xs font-medium uppercase tracking-wide text-text-lighter mb-0.5">Your response</p>
                <p className="text-sm text-charcoal leading-relaxed">{s.ownerResponse}</p>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => startEdit(s)}>Edit</Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-red-dark hover:text-red-dark"
                    onClick={() => setDeletingId(s.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {showAddForm && (
          <div className="rounded-xl border border-dashed border-orange bg-orange-light/30 p-4">
            <p className="text-xs font-semibold text-orange mb-3">New sample</p>
            <div className="mb-3">
              <label className={labelClass}>Review type</label>
              <select
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-charcoal focus:border-orange focus:outline-none"
                value={addForm.reviewType}
                onChange={e => setAddForm(f => ({ ...f, reviewType: e.target.value }))}
              >
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className={labelClass}>Customer review</label>
              <textarea
                className={textareaClass}
                placeholder="Paste a real review you received…"
                value={addForm.sampleReview}
                onChange={e => setAddForm(f => ({ ...f, sampleReview: e.target.value }))}
              />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Your response</label>
              <textarea
                className={textareaClass}
                placeholder="How you actually responded to it…"
                value={addForm.ownerResponse}
                onChange={e => setAddForm(f => ({ ...f, ownerResponse: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM) }}>Cancel</Button>
              <Button
                size="sm"
                disabled={saving || !addForm.sampleReview || !addForm.ownerResponse}
                onClick={addSample}
              >
                {saving ? 'Saving…' : 'Save sample'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {!showAddForm && (
        <Button variant="secondary" className="w-full" onClick={() => setShowAddForm(true)}>
          + Add a sample
        </Button>
      )}
    </Card>
  )
}
