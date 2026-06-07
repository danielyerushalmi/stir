// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLimit = vi.hoisted(() => vi.fn())
const mockSlidingWindow = vi.hoisted(() => vi.fn(() => ({ type: 'slidingWindow' })))

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    constructor() {}
    limit = mockLimit
    static slidingWindow = mockSlidingWindow
  },
}))

vi.mock('@upstash/redis', () => {
  function Redis(this: any) {}
  return { Redis }
})

import { checkRateLimit } from '../redis'

describe('checkRateLimit', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns true when sliding window allows the request', async () => {
    mockLimit.mockResolvedValue({ success: true })
    expect(await checkRateLimit('user:abc', 5, 60)).toBe(true)
  })

  it('returns false when sliding window denies the request', async () => {
    mockLimit.mockResolvedValue({ success: false })
    expect(await checkRateLimit('user:abc', 5, 60)).toBe(false)
  })

  it('calls ratelimit.limit with the provided key', async () => {
    mockLimit.mockResolvedValue({ success: true })
    await checkRateLimit('mykey', 10, 120)
    expect(mockLimit).toHaveBeenCalledOnce()
    expect(mockLimit).toHaveBeenCalledWith('mykey')
  })

  it('configures sliding window with correct maxCount and window string', async () => {
    mockLimit.mockResolvedValue({ success: true })
    await checkRateLimit('key', 3, 300)
    expect(mockSlidingWindow).toHaveBeenCalledWith(3, '300 s')
  })

  it('returns false (fail closed) when ratelimit.limit throws', async () => {
    mockLimit.mockRejectedValue(new Error('Redis connection failed'))
    expect(await checkRateLimit('key', 5, 60)).toBe(false)
  })

  it('handles monthly windows (31 days) correctly', async () => {
    mockLimit.mockResolvedValue({ success: true })
    await checkRateLimit('drafts:abc:2026-01', 3, 31 * 24 * 3600)
    expect(mockSlidingWindow).toHaveBeenCalledWith(3, `${31 * 24 * 3600} s`)
  })

  it('handles 24-hour windows correctly', async () => {
    mockLimit.mockResolvedValue({ success: false })
    expect(await checkRateLimit('insights:abc', 1, 86400)).toBe(false)
    expect(mockSlidingWindow).toHaveBeenCalledWith(1, '86400 s')
  })
})
