'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'

interface AccountTabProps {
  email: string
  plan: string
  memberSince: string
  onToast: (message: string, type: 'success' | 'error') => void
}

export function AccountTab({ email, plan, memberSince, onToast }: AccountTabProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function deleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch('/api/settings/account', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.push('/')
    } catch {
      onToast('Failed to delete account', 'error')
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const rowClass = 'flex items-center py-3 border-b border-border last:border-0'
  const labelClass = 'w-32 flex-shrink-0 text-xs font-medium uppercase tracking-wide text-text-lighter'

  return (
    <>
      <Card className="mb-4">
        <h2 className="mb-1 text-sm font-semibold text-charcoal">Account</h2>
        <p className="mb-5 text-xs text-text-lighter">Your profile and current plan.</p>

        <div className={rowClass}>
          <span className={labelClass}>Email</span>
          <span className="text-sm text-charcoal">{email}</span>
        </div>
        <div className={rowClass}>
          <span className={labelClass}>Plan</span>
          <Badge variant={plan === 'FREE' ? 'gray' : 'orange'}>
            {plan === 'FREE' ? 'Free plan' : plan.charAt(0) + plan.slice(1).toLowerCase() + ' plan'}
          </Badge>
        </div>
        <div className={rowClass}>
          <span className={labelClass}>Member since</span>
          <span className="text-sm text-charcoal">{memberSince}</span>
        </div>

        <div className="flex justify-end mt-4">
          <SignOutButton>
            <Button variant="secondary">Sign out</Button>
          </SignOutButton>
        </div>
      </Card>

      <div className="rounded-xl border border-red-light bg-white p-6">
        <h3 className="mb-1 text-sm font-semibold text-red-dark">Danger zone</h3>
        <p className="mb-5 text-xs text-text-lighter">These actions are permanent and cannot be undone.</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-charcoal">Delete account</p>
            <p className="text-xs text-text-lighter mt-0.5">Permanently deletes your restaurant, reviews, and all data.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="text-red-dark hover:bg-red-light border-red-light"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete account
          </Button>
        </div>
      </div>

      {showDeleteModal && (
        <Modal
          title="Delete your account"
          onClose={() => { setShowDeleteModal(false); setConfirmText('') }}
          footer={
            <>
              <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setConfirmText('') }}>
                Cancel
              </Button>
              <Button
                className="bg-red-dark hover:bg-red-dark/90 text-white"
                disabled={confirmText !== 'DELETE' || deleting}
                onClick={deleteAccount}
              >
                {deleting ? 'Deleting…' : 'Delete account'}
              </Button>
            </>
          }
        >
          <p className="text-sm text-charcoal mb-4">
            This will permanently delete your restaurant, all reviews, voice samples, and your account.
            <strong className="block mt-2">Type DELETE to confirm.</strong>
          </p>
          <input
            className="w-full rounded-lg border border-border bg-cream px-4 py-2.5 text-sm text-charcoal focus:border-red-dark focus:outline-none focus:ring-2 focus:ring-red-dark/20"
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
          />
        </Modal>
      )}
    </>
  )
}
