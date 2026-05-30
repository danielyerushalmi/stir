// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getBusinessByName, getBusinessDetails, getReviews, YelpApiError } from '../yelp'

beforeEach(() => {
  process.env.YELP_API_KEY = 'test-key'
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function mockFetch(data: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  }))
}

describe('YelpApiError', () => {
  it('is an Error subclass with correct name and status', () => {
    const err = new YelpApiError(404, 'not found')
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('YelpApiError')
    expect(err.status).toBe(404)
    expect(err.message).toBe('not found')
  })
})

describe('getBusinessByName', () => {
  it('returns businessId, rating, reviewCount from first result', async () => {
    mockFetch({ businesses: [{ id: 'biz-123', rating: 4.2, review_count: 347 }] })
    const result = await getBusinessByName('The Corner Table', 'Austin, TX')
    expect(result).toEqual({ businessId: 'biz-123', rating: 4.2, reviewCount: 347 })
  })

  it('throws YelpApiError(404) when no businesses found', async () => {
    mockFetch({ businesses: [] })
    const err = await getBusinessByName('Unknown', 'Nowhere').catch(e => e)
    expect(err).toBeInstanceOf(YelpApiError)
    expect(err.status).toBe(404)
  })

  it('throws YelpApiError on non-2xx response', async () => {
    mockFetch({ error: 'UNAUTHORIZED' }, 401)
    const err = await getBusinessByName('X', 'Y').catch(e => e)
    expect(err).toBeInstanceOf(YelpApiError)
    expect(err.status).toBe(401)
  })
})

describe('getBusinessDetails', () => {
  it('returns rating and reviewCount', async () => {
    mockFetch({ id: 'biz-123', rating: 4.5, review_count: 500 })
    const result = await getBusinessDetails('biz-123')
    expect(result).toEqual({ rating: 4.5, reviewCount: 500 })
  })

  it('throws YelpApiError on non-2xx response', async () => {
    mockFetch({ error: 'NOT_FOUND' }, 404)
    const err = await getBusinessDetails('bad-id').catch(e => e)
    expect(err).toBeInstanceOf(YelpApiError)
    expect(err.status).toBe(404)
  })
})

describe('getReviews', () => {
  it('maps Yelp review shape to YelpReview', async () => {
    mockFetch({
      reviews: [{
        id: 'rev-1',
        rating: 5,
        text: 'Amazing food!',
        time_created: '2024-03-15 12:00:00',
        user: { name: 'Alice' },
      }],
    })
    const reviews = await getReviews('biz-123')
    expect(reviews).toHaveLength(1)
    expect(reviews[0]).toMatchObject({
      externalId: 'rev-1',
      rating: 5,
      reviewText: 'Amazing food!',
      authorName: 'Alice',
    })
    expect(reviews[0].reviewDate).toBeInstanceOf(Date)
  })

  it('returns empty array when no reviews', async () => {
    mockFetch({ reviews: [] })
    expect(await getReviews('biz-123')).toHaveLength(0)
  })
})
