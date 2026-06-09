const YELP_BASE = 'https://api.yelp.com/v3'

export class YelpApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'YelpApiError'
  }
}

const YELP_TIMEOUT_MS = 15_000
const YELP_MAX_RETRIES = 2

async function yelpFetch<T>(path: string): Promise<T> {
  if (!process.env.YELP_API_KEY) {
    throw new YelpApiError(503, 'Yelp integration is not yet available')
  }

  let attempt = 0
  // Retry only on transient failures (429 / 5xx) with small linear backoff.
  for (;;) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), YELP_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(`${YELP_BASE}${path}`, {
        headers: { Authorization: `Bearer ${process.env.YELP_API_KEY}` },
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    if (res.ok) {
      return res.json() as Promise<T>
    }

    const body = await res.text()
    const retryable = res.status === 429 || res.status >= 500
    if (retryable && attempt < YELP_MAX_RETRIES) {
      attempt++
      // Keep the raw Yelp body in server logs only — never surfaced to callers.
      console.warn(`Yelp request ${res.status}, retry ${attempt}/${YELP_MAX_RETRIES}`, body)
      await new Promise(resolve => setTimeout(resolve, 300 * attempt))
      continue
    }

    throw new YelpApiError(res.status, body)
  }
}

export async function getBusinessByName(
  name: string,
  location: string,
): Promise<{ businessId: string; rating: number; reviewCount: number }> {
  const params = new URLSearchParams({ term: name, location, limit: '1' })
  const data = await yelpFetch<{
    businesses: Array<{ id: string; rating: number; review_count: number }>
  }>(`/businesses/search?${params}`)
  const biz = data.businesses[0]
  if (!biz) throw new YelpApiError(404, 'Business not found')
  return { businessId: biz.id, rating: biz.rating, reviewCount: biz.review_count }
}

export async function getBusinessDetails(
  businessId: string,
): Promise<{ rating: number; reviewCount: number }> {
  const data = await yelpFetch<{ rating: number; review_count: number }>(
    `/businesses/${encodeURIComponent(businessId)}`,
  )
  return { rating: data.rating, reviewCount: data.review_count }
}

export type YelpReview = {
  externalId: string
  rating: number
  reviewText: string
  authorName: string
  reviewDate: Date
}

export async function getReviews(businessId: string): Promise<YelpReview[]> {
  const data = await yelpFetch<{
    reviews: Array<{
      id: string
      rating: number
      text: string
      time_created: string
      user: { name: string }
    }>
  }>(`/businesses/${encodeURIComponent(businessId)}/reviews?limit=3&sort_by=newest`)
  return data.reviews.map(r => ({
    externalId: r.id,
    rating: r.rating,
    reviewText: r.text,
    authorName: r.user.name,
    reviewDate: new Date(r.time_created),
  }))
}
