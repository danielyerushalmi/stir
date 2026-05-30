import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1])) end
return count
`

export async function checkRateLimit(key: string, maxCount: number, windowSeconds: number): Promise<boolean> {
  const count = (await redis.eval(RATE_LIMIT_SCRIPT, [key], [String(windowSeconds)])) as number
  return count <= maxCount
}
