'use client'
import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ScoreCardProps {
  label: string
  score: number | null
  trend?: { direction: 'up' | 'down' | 'flat'; delta: number }
  subtitle?: string
  integer?: boolean
}

function useCountUp(target: number | null, integer = false, duration = 1200) {
  const [value, setValue] = useState(0)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (target === null) return
    if (prefersReduced) { setValue(target); return }
    let cancelled = false
    const start = Date.now()
    const tick = () => {
      if (cancelled) return
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const raw = eased * target
      setValue(integer ? Math.round(raw) : Math.round(raw * 10) / 10)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    return () => { cancelled = true }
  }, [target, integer, duration, prefersReduced])

  return value
}

export function ScoreCard({ label, score, trend, subtitle, integer = false }: ScoreCardProps) {
  const animated = useCountUp(score, integer)
  const displayValue = score !== null
    ? (integer ? String(Math.round(animated)) : animated.toFixed(1))
    : '—'

  const borderColor = score === null ? 'border-l-border'
    : score >= 4.0 ? 'border-l-green'
    : score >= 3.0 ? 'border-l-amber-dark'
    : 'border-l-red-dark'

  const textColor = score === null ? 'text-brown'
    : score >= 4.0 ? 'text-green'
    : score >= 3.0 ? 'text-amber-dark'
    : 'text-red-dark'

  return (
    <div className={cn('rounded-xl border-l-4 border border-border bg-white p-6 shadow-md', borderColor)}>
      <p className="text-xs font-medium text-text-lighter uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <p className={cn('text-3xl font-semibold', textColor)}>{displayValue}</p>
        {trend && trend.direction !== 'flat' && (
          <span className={cn('text-sm font-medium mb-1', trend.direction === 'up' ? 'text-green-dark' : 'text-red-dark')}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.delta}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-text-lighter mt-1">{subtitle}</p>}
    </div>
  )
}
