import { cn } from '@/lib/utils'

interface ScoreCardProps {
  label: string
  score: number | null
  trend?: { direction: 'up' | 'down' | 'flat'; delta: number }
  subtitle?: string
  integer?: boolean
}

export function ScoreCard({ label, score, trend, subtitle, integer = false }: ScoreCardProps) {
  const color = score === null ? 'text-charcoal' : score >= 4.0 ? 'text-green' : score >= 3.0 ? 'text-amber-dark' : 'text-red-dark'
  const display = score !== null ? (integer ? String(score) : score.toFixed(1)) : '—'

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <p className="text-xs font-medium text-text-lighter uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <p className={cn('text-3xl font-semibold', color)}>{display}</p>
        {trend && trend.direction !== 'flat' && (
          <span className={cn('text-sm font-medium mb-1', trend.direction === 'up' ? 'text-green' : 'text-red-dark')}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.delta}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-text-lighter mt-1">{subtitle}</p>}
    </div>
  )
}
