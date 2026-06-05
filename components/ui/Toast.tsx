'use client'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      role={type === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg bg-charcoal px-4 py-2.5 text-sm text-white shadow-lg"
    >
      <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', type === 'success' ? 'bg-green' : 'bg-red-dark')} />
      {message}
    </motion.div>
  )
}
