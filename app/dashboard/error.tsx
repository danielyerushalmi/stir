'use client'
import { useEffect } from 'react'
import Link from 'next/link'

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
        <button
          onClick={reset}
          className="rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-dark transition-colors"
        >
          Try again
        </button>
        <Link href="/" className="text-sm text-text-muted hover:text-brown transition-colors">
          Go home
        </Link>
      </div>
    </div>
  )
}
