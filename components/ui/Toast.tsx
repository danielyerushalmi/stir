'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  const [paused, setPaused] = useState(false)
  // Keep the latest onDismiss without re-arming the timer on every parent render.
  const onDismissRef = useRef(onDismiss)
  useEffect(() => { onDismissRef.current = onDismiss }, [onDismiss])

  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => onDismissRef.current(), 4000)
    return () => clearTimeout(t)
  }, [message, type, paused]) // re-arm per toast so a stale timer can't dismiss a new one

  return (
    <motion.div
      role={type === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg bg-charcoal px-4 py-2.5 text-sm text-white shadow-lg"
    >
      <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', type === 'success' ? 'bg-green' : 'bg-red-dark')} />
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-1 flex-shrink-0 rounded p-0.5 text-white/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  )
}
