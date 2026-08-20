'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

interface ResponseDraftProps {
  reviewId: string
  draft: string
  platform?: string
  /** The review already has a public reply on the platform (e.g. Google) — approving overwrites it. */
  hasExternalReply?: boolean
  /** 'posted' when the reply went live externally, 'saved' when stored locally only, 'error' on failure. */
  onApprove: (reviewId: string, finalText: string) => Promise<'posted' | 'saved' | 'error'>
  onDismiss: (reviewId: string) => Promise<void>
  onRegenerate?: () => void
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

export function ResponseDraft({ reviewId, draft, platform, hasExternalReply, onApprove, onDismiss, onRegenerate }: ResponseDraftProps) {
  const [text, setText] = useState(draft)
  const [loading, setLoading] = useState<'approve' | 'dismiss' | null>(null)
  const [outcome, setOutcome] = useState<'posted' | 'saved' | null>(null)
  const [showTyping, setShowTyping] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)

  useEffect(() => {
    setText(draft)
    setShowTyping(true)
  }, [draft])

  useEffect(() => {
    const t = setTimeout(() => setShowTyping(false), 1000)
    return () => clearTimeout(t)
  }, [draft])

  if (outcome) {
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
          className="text-green-dark text-lg"
          aria-hidden="true"
        >
          ✓
        </motion.span>
        <p className="text-sm text-green-dark font-medium">
          {outcome === 'posted' ? 'Response approved and posted.' : 'Response saved.'}
        </p>
      </motion.div>
    )
  }

  return (
    <>
      {showConfirm && (
        <Modal
          title="Approve this reply?"
          onClose={() => setShowConfirm(false)}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={loading === 'approve'}
                onClick={async () => {
                  setShowConfirm(false)
                  setLoading('approve')
                  try {
                    const result = await onApprove(reviewId, text)
                    // On error the parent showed a toast — keep the draft editable.
                    if (result !== 'error') setOutcome(result)
                  } finally {
                    setLoading(null)
                  }
                }}
              >
                {loading === 'approve' ? 'Posting...' : 'Confirm & post'}
              </Button>
            </>
          }
        >
          <p className="text-sm text-text-muted mb-3">
            Your reply will be saved and posted publicly to your review platform.
          </p>
          {hasExternalReply && (
            <p className="mb-3 rounded-lg border border-amber-dark/30 bg-amber-light px-3 py-2 text-sm text-amber-dark">
              This review already has a reply on Google. Posting will replace the existing reply.
            </p>
          )}
          <div className="rounded-lg bg-cream border border-border p-3 text-sm text-charcoal leading-relaxed">
            {text}
          </div>
        </Modal>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border-l-4 border border-orange/30 border-l-orange bg-orange-light p-4"
      >
        <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-orange/20">
          <span className="text-orange-dark text-sm" aria-hidden="true">✦</span>
          <p className="text-sm font-medium text-orange-dark">AI Draft</p>
        </div>
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
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-brown focus:outline-none focus:ring-2 focus:ring-orange/20"
              />
              <p className={cn(
                'text-xs text-right mb-3 -mt-2',
                text.length > 300 ? 'text-red-dark' : text.length >= 80 ? 'text-green-dark' : 'text-text-lighter'
              )}>
                {text.length}/300
              </p>
              <div className="flex gap-2">
                {platform === 'YELP' ? (
                  <Button
                    size="sm"
                    disabled={loading !== null}
                    title="Yelp doesn't allow third-party posting — copy this and paste it into Yelp directly."
                    onClick={async () => {
                      if (!navigator.clipboard?.writeText) {
                        setCopyFailed(true)
                        setTimeout(() => setCopyFailed(false), 2000)
                        return
                      }
                      try {
                        await navigator.clipboard.writeText(text)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      } catch {
                        setCopyFailed(true)
                        setTimeout(() => setCopyFailed(false), 2000)
                      }
                    }}
                  >
                    {copied ? 'Copied!' : copyFailed ? 'Copy failed — select & copy' : 'Copy to clipboard'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={loading !== null}
                    onClick={() => setShowConfirm(true)}
                  >
                    Approve & Post
                  </Button>
                )}
                {onRegenerate && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={loading !== null}
                    onClick={onRegenerate}
                  >
                    Regenerate
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={loading !== null}
                  onClick={async () => {
                    setLoading('dismiss')
                    try {
                      await onDismiss(reviewId)
                    } finally {
                      setLoading(null)
                    }
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
