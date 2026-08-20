export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Liveness/readiness probe for uptime monitoring. Public (no auth) and cheap:
 * one SELECT 1 with a short timeout. Returns 503 when the database is
 * unreachable so monitors can distinguish "app up, DB down" from a hard crash.
 */
export async function GET() {
  try {
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB health check timed out')), 5_000)),
    ])
    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('Health check failed:', err)
    return NextResponse.json({ status: 'degraded', error: 'database unreachable' }, { status: 503 })
  }
}
