'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <p className="text-text-muted mb-2 text-sm">Something went wrong loading your dashboard.</p>
      <div className="flex items-center gap-3 mt-4">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <Link href="/" className="text-sm text-text-muted hover:text-brown transition-colors">
          Go home
        </Link>
      </div>
    </div>
  )
}
