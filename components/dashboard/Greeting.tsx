'use client'
import { useEffect, useState } from 'react'

/**
 * Time-of-day greeting computed on the client so it reflects the visitor's
 * clock, not the server's timezone. Renders a neutral greeting during SSR
 * (and the first client render) to avoid a hydration mismatch.
 */
export function Greeting({ name }: { name: string }) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()) }, [])

  const hour = now?.getHours()
  const timeGreeting =
    now === null ? 'Welcome back'
    : hour! < 12 ? 'Good morning'
    : hour! < 18 ? 'Good afternoon'
    : 'Good evening'
  const dayLabel = now?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal tracking-tight">{timeGreeting}, {name}</h1>
      <p className="text-sm text-text-muted mt-1">{dayLabel ?? ' '}</p>
    </div>
  )
}
