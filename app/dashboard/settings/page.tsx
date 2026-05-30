'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Toast } from '@/components/ui/Toast'
import { RestaurantTab } from './_components/RestaurantTab'
import { PlatformsTab } from './_components/PlatformsTab'
import { VoiceTab } from './_components/VoiceTab'
import { AccountTab } from './_components/AccountTab'
import { cn } from '@/lib/utils'

type Tab = 'restaurant' | 'platforms' | 'voice' | 'account'

interface SettingsData {
  restaurant: {
    id: string
    name: string
    cuisineType: string
    city: string
    vibe: string
    yelpRating: number | null
    yelpReviewCount: number | null
  }
  platforms: { name: string; isConnected: boolean; lastSyncedAt: string | null }[]
  voiceSamples: { id: string; reviewType: string; sampleReview: string; ownerResponse: string }[]
  subscription: { plan: string } | null
}

interface ToastState {
  message: string
  type: 'success' | 'error'
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'platforms',  label: 'Platforms' },
  { id: 'voice',      label: 'Voice & Tone' },
  { id: 'account',    label: 'Account' },
]

const VALID_TABS: Tab[] = ['restaurant', 'platforms', 'voice', 'account']

export default function SettingsPage() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('restaurant')
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  // Read ?tab= on mount so OAuth redirects land on the correct tab
  useEffect(() => {
    const tab = searchParams.get('tab') as Tab | null
    if (tab && VALID_TABS.includes(tab)) setActiveTab(tab)
  }, [searchParams])

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }, [])

  const loadSettings = useCallback(() => {
    setLoading(true)
    setError(false)
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-charcoal mb-6">Settings</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-orange bg-orange-light text-orange'
                : 'border-border bg-white text-text-lighter hover:border-orange hover:text-orange'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-orange-light/20 rounded-lg" />
          <div className="h-10 bg-orange-light/20 rounded-lg" />
          <div className="h-10 bg-orange-light/20 rounded-lg" />
          <div className="h-10 bg-orange-light/20 rounded-lg" />
        </div>
      ) : error || !data ? (
        <div>
          <p className="text-sm text-red-dark">Failed to load settings. Please refresh.</p>
          <button onClick={loadSettings} className="mt-2 text-sm text-orange hover:underline">Try again</button>
        </div>
      ) : (
        <>
          {activeTab === 'restaurant' && (
            <RestaurantTab restaurant={data.restaurant} onToast={showToast} />
          )}
          {activeTab === 'platforms' && (
            <PlatformsTab
              platforms={data.platforms}
              onToast={showToast}
              yelpData={
                data.restaurant.yelpRating != null && data.restaurant.yelpReviewCount != null
                  ? { rating: data.restaurant.yelpRating, reviewCount: data.restaurant.yelpReviewCount }
                  : undefined
              }
            />
          )}
          {activeTab === 'voice' && (
            <VoiceTab voiceSamples={data.voiceSamples} onToast={showToast} />
          )}
          {activeTab === 'account' && (
            <AccountTab
              email={user?.primaryEmailAddress?.emailAddress ?? '—'}
              plan={data.subscription?.plan ?? 'FREE'}
              memberSince={memberSince}
              onToast={showToast}
            />
          )}
        </>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}
