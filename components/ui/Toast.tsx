'use client'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg bg-charcoal px-4 py-2.5 text-sm text-white shadow-lg">
      <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', type === 'success' ? 'bg-green' : 'bg-red-dark')} />
      {message}
    </div>
  )
}
