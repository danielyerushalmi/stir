import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache limiter instances so each unique (maxCount, windowSeconds) builds exactly
// one Ratelimit — avoids reconstructing on every call. Same prefix + sliding-window
// config keeps existing Redis keys unaffected.
const limiterCache = new Map<string, Ratelimit>()

function getLimiter(maxCount: number, windowSeconds: number): Ratelimit {
  const cacheKey = `${maxCount}:${windowSeconds}`
  let ratelimit = limiterCache.get(cacheKey)
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxCount, `${windowSeconds} s`),
      prefix: '@stir/rl',
    })
    limiterCache.set(cacheKey, ratelimit)
  }
  return ratelimit
}

// Sliding window prevents the 2× burst possible with fixed windows at boundary resets.
export async function checkRateLimit(
  key: string,
  maxCount: number,
  windowSeconds: number,
  opts?: { failOpen?: boolean }
): Promise<boolean> {
  try {
    const { success } = await getLimiter(maxCount, windowSeconds).limit(key)
    // success === false means the limit was exceeded for this key (deny).
    return success
  } catch (err) {
    // The limiter itself is unavailable (e.g. Redis outage) — this is NOT a
    // "limit exceeded" decision. Default to fail-OPEN so an outage doesn't 429
    // every write path; abuse-sensitive callers opt into fail-closed.
    console.error('Rate limiter unavailable; falling back to failOpen=' + (opts?.failOpen ?? true) + ':', err)
    return opts?.failOpen ?? true
  }
}
