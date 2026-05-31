const YELP_BASE = 'https://api.yelp.com/v3'

export class YelpApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'YelpApiError'
  }
}

async function yelpFetch<T>(path: string): Promise<T> {
  if (!process.env.YELP_API_KEY) {
    throw new YelpApiError(503, 'Yelp integration is not yet available')
  }
  const res = await fetch(`${YELP_BASE}${path}`, {
    headers: { Authorization: `Bearer ${process.env.YELP_API_KEY}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new YelpApiError(res.status, body)
  }
  return res.json() as Promise<T>
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
