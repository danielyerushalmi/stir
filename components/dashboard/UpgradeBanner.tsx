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
        <p className="font-medium text-orange text-sm">Upgrade to {planName}</p>
        <p className="text-xs text-orange/80 mt-0.5">Paid plans are coming soon. You&apos;ll be notified when they launch.</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="ml-4 shrink-0 text-orange/60 hover:text-orange text-lg leading-none"
      >
        &times;
      </button>
    </div>
  )
}
