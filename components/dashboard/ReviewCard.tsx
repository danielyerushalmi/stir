'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const PLATFORM_COLORS: Record<string, string> = {
  GOOGLE: 'text-blue-600',
  YELP: 'text-red-500',
  TRIPADVISOR: 'text-green',
  DOORDASH: 'text-red-600',
  UBEREATS: 'text-green',
  GRUBHUB: 'text-orange',
}

interface ReviewCardProps {
  review: {
    id: string
    platform: string
    rating: number
    reviewText: string
    authorName: string
    reviewDate: string | Date
    isDelivery: boolean
    response?: { id: string; draftText: string; status: string } | null
  }
  onDraftRequest: (reviewId: string) => void
}

export function ReviewCard({ review, onDraftRequest }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false)
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)

  return (
    <div className="border border-border rounded-xl bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs font-medium uppercase tracking-wide', PLATFORM_COLORS[review.platform] || 'text-text-muted')}>{review.platform}</span>
            {review.isDelivery && <Badge variant="gray">Delivery</Badge>}
            <span className={cn('text-sm', review.rating >= 4 ? 'text-green' : review.rating <= 2 ? 'text-red-dark' : 'text-amber-dark')}>{stars}</span>
          </div>
          <p className="text-sm font-medium text-charcoal">{review.authorName}</p>
          <p className="text-xs text-text-lighter mt-0.5">{new Date(review.reviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          <p className={cn('mt-2 text-sm text-text-muted', !expanded && 'line-clamp-2')}>{review.reviewText}</p>
          {review.reviewText.length > 120 && (
            <button className="text-xs text-orange mt-1" onClick={() => setExpanded(e => !e)}>{expanded ? 'Show less' : 'Read more'}</button>
          )}
        </div>
        <div className="shrink-0">
          {review.response
            ? <Badge variant={review.response.status === 'POSTED' ? 'green' : 'orange'}>{review.response.status === 'POSTED' ? 'Replied' : 'Draft ready'}</Badge>
            : <Button size="sm" onClick={() => onDraftRequest(review.id)}>Draft reply →</Button>
          }
        </div>
      </div>
    </div>
  )
}
