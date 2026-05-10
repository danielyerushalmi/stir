import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function checkRateLimit(key: string, maxCount: number, windowSeconds: number): Promise<boolean> {
  const pipeline = redis.pipeline()
  pipeline.incr(key)
  pipeline.expire(key, windowSeconds)
  const [count] = await pipeline.exec() as [number, number]
  return count <= maxCount
}
