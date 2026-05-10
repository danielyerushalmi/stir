'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'

interface ResponseDraftProps {
  reviewId: string
  draft: string
  onApprove: (reviewId: string, finalText: string) => Promise<void>
  onDismiss: (reviewId: string) => Promise<void>
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-2">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-orange"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

export function ResponseDraft({ reviewId, draft, onApprove, onDismiss }: ResponseDraftProps) {
  const [text, setText] = useState(draft)
  const [loading, setLoading] = useState<'approve' | 'dismiss' | null>(null)
  const [posted, setPosted] = useState(false)
  const [showTyping, setShowTyping] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowTyping(false), 1000)
    return () => clearTimeout(t)
  }, [])

  if (posted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-lg bg-green-light border border-green/30 p-4 flex items-center gap-3"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="text-green text-lg"
        >
          ✓
        </motion.span>
        <p className="text-sm text-green font-medium">Response approved and marked as posted.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-l-4 border border-orange/30 border-l-orange bg-orange-light p-4"
    >
      <p className="text-xs font-medium text-orange uppercase tracking-wide mb-2">AI Draft</p>
      <AnimatePresence mode="wait">
        {showTyping ? (
          <motion.div key="typing" exit={{ opacity: 0 }}>
            <TypingDots />
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <textarea
              rows={4}
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-brown focus:outline-none focus:ring-2 focus:ring-orange/20 mb-3"
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
