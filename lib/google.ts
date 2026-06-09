import { google } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'
import { db } from '@/lib/db'
import type { Platform } from '@prisma/client'
import { encryptToken, decryptToken } from '@/lib/crypto'

export { encryptToken, decryptToken }

export class GoogleDisconnectedError extends Error {
  constructor() {
    super('Google account disconnected — please reconnect.')
    this.name = 'GoogleDisconnectedError'
  }
}

const STAR_MAP: Record<string, number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
}

export function starRatingToNumber(rating: string): number {
  return STAR_MAP[rating] ?? 3
}

function createBaseClient(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  )
}

export function getGoogleOAuthUrl(state: string): string {
  const client = createBaseClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/business.manage'],
    state,
  })
}

/**
 * Exchanges an authorization code for tokens.
 * Note: refresh_token is only present on first consent.
 * Always pass prompt='consent' in the OAuth URL to guarantee it is returned.
 */
export async function exchangeCodeForTokens(code: string) {
  const client = createBaseClient()
  const { tokens } = await client.getToken(code)
  return tokens
}

export function buildClientFromTokens(tokens: {
  access_token?: string | null
  refresh_token?: string | null
  expiry_date?: number | null
}): OAuth2Client {
  const client = createBaseClient()
  client.setCredentials({
    access_token: tokens.access_token ?? undefined,
    refresh_token: tokens.refresh_token ?? undefined,
    expiry_date: tokens.expiry_date ?? undefined,
  })
  return client
}

export async function getOAuthClient(platform: Platform): Promise<OAuth2Client> {
  const client = createBaseClient()
  client.setCredentials({
    access_token: platform.accessToken ? decryptToken(platform.accessToken) : undefined,
    refresh_token: platform.refreshToken ? decryptToken(platform.refreshToken) : undefined,
    expiry_date: platform.tokenExpiresAt?.getTime() ?? undefined,
  })

  const expiresAt = platform.tokenExpiresAt?.getTime()
  const fiveMinutes = 5 * 60 * 1000

  if (expiresAt !== undefined && Date.now() >= expiresAt - fiveMinutes) {
    try {
      const { credentials } = await client.refreshAccessToken()
      await db.platform.update({
        where: { id: platform.id },
        data: {
          accessToken: credentials.access_token ? encryptToken(credentials.access_token) : undefined,
          tokenExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
          // Google may rotate the refresh_token on refresh. If a new one is
          // returned it MUST be persisted (encrypted), or the next refresh
          // fails and the account force-disconnects.
          ...(credentials.refresh_token
            ? { refreshToken: encryptToken(credentials.refresh_token) }
            : {}),
        },
      })
      client.setCredentials(credentials)
    } catch {
      // Clear stored tokens so stale/invalid credentials aren't left behind.
      await db.platform.update({
        where: { id: platform.id },
        data: { isConnected: false, accessToken: null, refreshToken: null, tokenExpiresAt: null },
      })
      throw new GoogleDisconnectedError()
    }
  }

  return client
}

export async function fetchGoogleLocationNames(client: OAuth2Client): Promise<string[]> {
  const accountsRes = await client.request<{ accounts?: Array<{ name: string }> }>({
    url: 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
  })

  const locationNames: string[] = []
  for (const account of accountsRes.data.accounts ?? []) {
    if (!account.name) continue
    try {
      const locsRes = await client.request<{ locations?: Array<{ name: string }> }>({
        url: `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name`,
      })
      for (const loc of locsRes.data.locations ?? []) {
        if (loc.name) locationNames.push(loc.name)
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status !== 403) throw err
      // 403 = this account has no accessible locations — skip
    }
  }
  return locationNames
}

export type GoogleReview = {
  externalId: string
  rating: number
  reviewText: string
  authorName: string
  reviewDate: Date
  hasReply: boolean
}

export async function fetchGoogleReviews(client: OAuth2Client, locationName: string): Promise<GoogleReview[]> {
  const MAX_PAGES = 20
  const reviews: GoogleReview[] = []
  let pageToken: string | undefined
  let pages = 0

  // Overall timeout so a hung upstream can't stall the serverless invocation
  // indefinitely (mirrors lib/ai.ts). The signal is passed to each page fetch.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25_000)
  try {
    do {
      if (pages >= MAX_PAGES) break
      pages++

      const url = `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=50${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`
      const res = await client.request<{
        reviews?: Array<{
          reviewId: string
          starRating: string
          comment?: string
          reviewer?: { displayName?: string }
          createTime: string
          reviewReply?: { comment: string }
        }>
        nextPageToken?: string
      }>({ url, signal: controller.signal })

      for (const r of res.data.reviews ?? []) {
        if (!r.reviewId) continue
        reviews.push({
          externalId: r.reviewId,
          rating: starRatingToNumber(r.starRating),
          reviewText: r.comment ?? '',
          authorName: r.reviewer?.displayName ?? 'Anonymous',
          reviewDate: new Date(r.createTime),
          hasReply: !!r.reviewReply,
        })
      }
      pageToken = res.data.nextPageToken
    } while (pageToken)
  } finally {
    clearTimeout(timer)
  }

  return reviews
}

export async function postGoogleReply(
  client: OAuth2Client,
  locationName: string,
  reviewId: string,
  text: string,
): Promise<void> {
  await client.request({
    url: `https://mybusiness.googleapis.com/v4/${locationName}/reviews/${reviewId}/reply`,
    method: 'PUT',
    data: { comment: text },
  })
}
