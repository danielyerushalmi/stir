'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface ResponseDraftProps {
  reviewId: string
  draft: string
  onApprove: (reviewId: string, finalText: string) => Promise<void>
  onDismiss: (reviewId: string) => Promise<void>
}

export function ResponseDraft({ reviewId, draft, onApprove, onDismiss }: ResponseDraftProps) {
  const [text, setText] = useState(draft)
  const [loading, setLoading] = useState<'approve' | 'dismiss' | null>(null)
  const [posted, setPosted] = useState(false)

  if (posted) {
    return (
      <div className="rounded-lg bg-green-light border border-green/30 p-4 text-sm text-green font-medium">
        ✓ Response approved and marked as posted.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-orange/30 bg-orange-light p-4">
      <p className="text-xs font-medium text-orange uppercase tracking-wide mb-2">AI Draft</p>
      <textarea
        rows={4}
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-orange/20 mb-3"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={loading !== null}
          onClick={async () => {
            setLoading('approve')
            await onApprove(reviewId, text)
            setPosted(true)
            setLoading(null)
          }}
        >
          {loading === 'approve' ? 'Posting...' : 'Approve & Post'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={loading !== null}
          onClick={async () => {
            setLoading('dismiss')
            await onDismiss(reviewId)
            setLoading(null)
          }}
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
