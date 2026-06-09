'use client'
import { useState } from 'react'

interface UpgradeBannerProps {
  planName: string
}

export function UpgradeBanner({ planName }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-orange/40 bg-orange-light px-5 py-4">
      <div>
        <p className="font-medium text-orange-dark text-sm">Upgrade to {planName}</p>
        <p className="text-xs text-orange-dark/90 mt-0.5">Paid plans are coming soon. You&apos;ll be notified when they launch.</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="ml-4 shrink-0 text-orange-dark/70 hover:text-orange-dark text-lg leading-none"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  )
}
