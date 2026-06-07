import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Sliding window prevents the 2× burst possible with fixed windows at boundary resets.
export async function checkRateLimit(key: string, maxCount: number, windowSeconds: number): Promise<boolean> {
  try {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxCount, `${windowSeconds} s`),
      prefix: '@stir/rl',
    })
    const { success } = await ratelimit.limit(key)
    return success
  } catch (err) {
    console.error('Rate limit check failed:', err)
    return false
  }
}
