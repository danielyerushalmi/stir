import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// TTL == -1 means the key exists with no expiry (e.g. after a Redis crash mid-write).
// Checking after every INCR — not just count == 1 — prevents permanently-stuck counters.
const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if redis.call('TTL', KEYS[1]) == -1 then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1])) end
return count
`

export async function checkRateLimit(key: string, maxCount: number, windowSeconds: number): Promise<boolean> {
  try {
    const count = (await redis.eval(RATE_LIMIT_SCRIPT, [key], [String(windowSeconds)])) as number
    return count <= maxCount
  } catch (err) {
    console.error('Rate limit check failed:', err)
    return false
  }
}
