// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock @upstash/redis at the constructor level using vi.hoisted so the mock
// function reference is available inside the hoisted vi.mock factory.
// Using a regular function (not arrow) as the constructor so `new Redis()` works.
// ---------------------------------------------------------------------------
const mockEval = vi.hoisted(() => vi.fn())

vi.mock('@upstash/redis', () => {
  function Redis(this: any) {
    this.eval = mockEval
  }
  return { Redis }
})

import { checkRateLimit } from '../redis'

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return true when the request count is below the limit', async () => {
    mockEval.mockResolvedValue(1) // first request in the window

    const allowed = await checkRateLimit('user:abc:draft', 5, 60)

    expect(allowed).toBe(true)
  })

  it('should return true when the request count equals the limit', async () => {
    mockEval.mockResolvedValue(5) // exactly at the limit

    const allowed = await checkRateLimit('user:abc:draft', 5, 60)

    expect(allowed).toBe(true)
  })

  it('should return false when the request count exceeds the limit', async () => {
    mockEval.mockResolvedValue(6) // one over the limit

    const allowed = await checkRateLimit('user:abc:draft', 5, 60)

    expect(allowed).toBe(false)
  })

  it('should call redis.eval with the rate-limit Lua script', async () => {
    mockEval.mockResolvedValue(1)

    await checkRateLimit('mykey', 10, 120)

    expect(mockEval).toHaveBeenCalledOnce()
    const [script, keys, args] = mockEval.mock.calls[0]
    expect(typeof script).toBe('string')
    expect(script).toContain('INCR')
    expect(keys).toEqual(['mykey'])
    expect(args).toEqual(['120'])
  })

  it('should pass windowSeconds as a string argument to eval', async () => {
    mockEval.mockResolvedValue(1)

    await checkRateLimit('somekey', 3, 300)

    const args = mockEval.mock.calls[0][2]
    expect(args).toEqual(['300'])
  })

  it('should return false (fail closed) when redis.eval throws', async () => {
    mockEval.mockRejectedValue(new Error('Redis connection failed'))

    const allowed = await checkRateLimit('key', 5, 60)
    expect(allowed).toBe(false)
  })

  it('should treat count of 0 as allowed (below limit)', async () => {
    mockEval.mockResolvedValue(0)

    const allowed = await checkRateLimit('key', 5, 60)

    expect(allowed).toBe(true)
  })
})
