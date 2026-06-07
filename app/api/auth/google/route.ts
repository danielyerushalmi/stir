export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { getGoogleOAuthUrl } from '@/lib/google'
import crypto from 'crypto'

function sanitizeReturnTo(raw: string | null): string {
  if (!raw) return '/dashboard'
  try {
    const url = new URL(raw, 'http://localhost')
    return url.pathname + url.search
  } catch {
    return '/dashboard'
  }
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const returnTo = sanitizeReturnTo(url.searchParams.get('returnTo')) || '/dashboard/settings?tab=platforms'

  const nonce = crypto.randomBytes(16).toString('hex')
  const state = Buffer.from(JSON.stringify({ nonce, returnTo, userId })).toString('base64url')

  const cookieStore = cookies()
  cookieStore.set('google_oauth_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return NextResponse.redirect(getGoogleOAuthUrl(state))
}
