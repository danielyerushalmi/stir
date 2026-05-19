export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'
import { exchangeCodeForTokens, buildClientFromTokens, fetchGoogleLocationNames } from '@/lib/google'

export async function GET(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.redirect(new URL('/sign-in', req.url))

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  const fallback = new URL('/dashboard/settings?tab=platforms&error=google_failed', req.url)

  if (errorParam) {
    return NextResponse.redirect(new URL('/dashboard/settings?tab=platforms&error=google_denied', req.url))
  }

  if (!code || !state) return NextResponse.redirect(fallback)

  const cookieStore = cookies()
  const savedNonce = cookieStore.get('google_oauth_nonce')?.value

  let parsedState: { nonce: string; returnTo: string }
  try {
    parsedState = JSON.parse(Buffer.from(state, 'base64url').toString())
  } catch {
    return NextResponse.redirect(fallback)
  }

  if (!savedNonce || parsedState.nonce !== savedNonce) return NextResponse.redirect(fallback)
  cookieStore.delete('google_oauth_nonce')

  try {
    const user = await getOrCreateDbUser()
    if (!user) throw new Error('no user')

    const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
    if (!restaurant) throw new Error('no restaurant')

    const tokens = await exchangeCodeForTokens(code)
    if (!tokens.access_token || !tokens.refresh_token) throw new Error('missing tokens')

    const client = buildClientFromTokens(tokens)
    const locationNames = await fetchGoogleLocationNames(client)

    if (locationNames.length === 0) {
      const safeReturn = parsedState.returnTo.startsWith('/') && !parsedState.returnTo.startsWith('//')
        ? parsedState.returnTo
        : '/dashboard'
      const noLocUrl = new URL(safeReturn, req.url)
      noLocUrl.searchParams.set('error', 'google_no_location')
      return NextResponse.redirect(noLocUrl)
    }

    // Use first location (MVP — multi-location picker can be added later)
    const locationName = locationNames[0]

    await db.platform.upsert({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: 'GOOGLE' } },
      update: {
        isConnected: true,
        externalId: locationName,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
      create: {
        restaurantId: restaurant.id,
        name: 'GOOGLE',
        isConnected: true,
        externalId: locationName,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    })

    const safeReturn = parsedState.returnTo.startsWith('/') && !parsedState.returnTo.startsWith('//')
      ? parsedState.returnTo
      : '/dashboard'
    return NextResponse.redirect(new URL(safeReturn, req.url))
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(fallback)
  }
}
