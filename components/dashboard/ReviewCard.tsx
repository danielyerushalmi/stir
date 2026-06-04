'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const PLATFORM_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  GOOGLE: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Google' },
  YELP: { bg: 'bg-red-50', text: 'text-red-600', label: 'Yelp' },
  TRIPADVISOR: { bg: 'bg-green-light', text: 'text-green', label: 'TripAdvisor' },
  DOORDASH: { bg: 'bg-red-50', text: 'text-red-600', label: 'DoorDash' },
  UBEREATS: { bg: 'bg-green-light', text: 'text-green', label: 'Uber Eats' },
  GRUBHUB: { bg: 'bg-orange-light', text: 'text-orange', label: 'Grubhub' },
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'text-orange' : 'text-border'}>★</span>
      ))}
    </span>
  )
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
  const platform = PLATFORM_STYLES[review.platform] ?? { bg: 'bg-border', text: 'text-text-muted', label: review.platform }

  return (
    <motion.div
      className="border border-border rounded-xl bg-white p-4 shadow-sm"
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', platform.bg, platform.text)}>
              {platform.label}
            </span>
            {review.isDelivery && <Badge variant="gray">Delivery</Badge>}
            <StarRating rating={review.rating} />
          </div>
          <p className="text-sm font-medium text-brown">{review.authorName}</p>
          <p className="text-xs text-text-lighter mt-0.5">
            {new Date(review.reviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p id={`review-text-${review.id}`} className={cn('mt-2 text-sm text-text-muted', !expanded && 'line-clamp-2')}>{review.reviewText}</p>
          {review.reviewText.length > 120 && (
            <button
              className="text-xs text-orange mt-1 hover:text-orange-dark"
              onClick={() => setExpanded(e => !e)}
              aria-expanded={expanded}
              aria-controls={`review-text-${review.id}`}
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
        <div className="shrink-0">
          {review.response ? (
            <Badge variant={review.response.status === 'POSTED' ? 'green' : 'orange'}>
              {review.response.status === 'POSTED' ? 'Replied' : 'Draft ready'}
            </Badge>
          ) : (
            <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.15 }}>
              <Button size="sm" onClick={() => onDraftRequest(review.id)}>
                {review.platform === 'YELP' ? 'Copy AI Response →' : 'Draft reply →'}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
