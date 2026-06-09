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
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i < rating ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.5"
            className={i < rating ? 'text-orange' : 'text-border'}
          />
        </svg>
      ))}
      <span className="ml-1 text-xs font-medium text-text-muted">{Number.isInteger(rating) ? `${rating}.0` : rating}</span>
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
  drafting?: boolean
}

export function ReviewCard({ review, onDraftRequest, drafting = false }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false)
  const platform = PLATFORM_STYLES[review.platform] ?? { bg: 'bg-border', text: 'text-text-muted', label: review.platform }
  const date = new Date(review.reviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <motion.div
      className={cn(
        'border border-border rounded-xl bg-white p-4 shadow-sm border-l-4',
        review.rating >= 4 ? 'border-l-green' : review.rating <= 2 ? 'border-l-red-dark' : 'border-l-amber-dark',
        review.response?.status === 'POSTED' && 'opacity-75 bg-cream'
      )}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', platform.bg, platform.text)}>
          {platform.label}
        </span>
        {review.isDelivery && <Badge variant="gray">Delivery</Badge>}
        <StarRating rating={review.rating} />
      </div>
      <p className="text-sm font-medium text-brown">{review.authorName}</p>
      <p className="text-xs text-text-lighter mt-0.5">{date}</p>
      <p id={`review-text-${review.id}`} className={cn('mt-2 text-sm text-charcoal', !expanded && 'line-clamp-2')}>{review.reviewText}</p>
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
      <div className="mt-3 flex items-center gap-2">
        {review.response ? (
          <Badge variant={review.response.status === 'POSTED' ? 'green' : 'orange'}>
            {review.response.status === 'POSTED' ? 'Replied' : 'Draft ready'}
          </Badge>
        ) : (
          <motion.div whileHover={drafting ? undefined : { x: 2 }} transition={{ duration: 0.15 }}>
            <Button size="sm" onClick={() => onDraftRequest(review.id)} disabled={drafting}>
              {drafting
                ? 'Drafting…'
                : review.platform === 'YELP' ? 'Copy AI Response →' : 'Draft reply →'}
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
