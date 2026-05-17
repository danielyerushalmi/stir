# Google Business Profile Integration + Bug Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock review sync with real Google Business Profile OAuth + API integration, enable posting approved replies to Google, and fix several small bugs identified in the codebase audit.

**Architecture:** A central `lib/google.ts` owns all Google API interactions (OAuth URL generation, token exchange, auto-refresh, review fetch, reply post) using the `googleapis` npm package's authenticated HTTP client. Two new Next.js API routes handle OAuth redirect and callback. Existing routes `/api/reviews/fetch` and `/api/reviews/respond` are updated in place. Bug fixes are self-contained per-file changes.

**Tech Stack:** Next.js 14 App Router, `googleapis` npm package, `google-auth-library` (bundled with googleapis), Prisma/PostgreSQL, Clerk auth, Framer Motion (existing)

---

## File Map

**Created:**
- `lib/google.ts`
- `lib/__tests__/google.test.ts`
- `app/api/auth/google/route.ts`
- `app/api/auth/google/callback/route.ts`
- `.env.example`

**Modified:**
- `prisma/schema.prisma`
- `app/api/reviews/fetch/route.ts`
- `app/api/reviews/respond/route.ts`
- `components/dashboard/ResponseDraft.tsx`
- `app/onboarding/connect/page.tsx`
- `app/dashboard/settings/_components/PlatformsTab.tsx`
- `app/dashboard/reviews/page.tsx`
- `app/dashboard/settings/_components/VoiceTab.tsx`
- `app/dashboard/insights/page.tsx`
- `app/dashboard/page.tsx`
- `README.md`

---

### Task 1: Install googleapis and scaffold .env.example

**Files:**
- Run: `npm install googleapis`
- Create: `.env.example`

- [ ] **Step 1: Install the googleapis package**

```bash
npm install googleapis
```

Expected output: `added N packages` with no errors.

- [ ] **Step 2: Create .env.example**

Create `.env.example` at the project root:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/stir

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Anthropic Claude AI
ANTHROPIC_API_KEY=sk-ant-...

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Google Business Profile OAuth
# Create credentials at console.cloud.google.com
# Enable: "My Business Business Information API", "My Business Account Management API"
# Add redirect URI: http://localhost:3000/api/auth/google/callback
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

- [ ] **Step 3: Add Google vars to your local .env.local**

Copy your actual Google Cloud credentials (obtained from console.cloud.google.com) into `.env.local`. Do not commit `.env.local`.

- [ ] **Step 4: Commit**

```bash
git add .env.example package.json package-lock.json
git commit -m "feat: add googleapis dependency and env example"
```

---

### Task 2: Add OAuth token fields to Platform schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add refreshToken and tokenExpiresAt to Platform model**

In `prisma/schema.prisma`, find the Platform model and add two fields after `accessToken`:

```prisma
model Platform {
  id           String     @id @default(cuid())
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  name         String
  externalId   String?
  accessToken  String?
  refreshToken   String?
  tokenExpiresAt DateTime?
  isConnected  Boolean    @default(false)
  lastSyncedAt DateTime?
  createdAt    DateTime   @default(now())

  @@unique([restaurantId, name])
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_google_oauth_tokens
```

Expected: migration file created, database updated. No errors.

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client` in output.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add refreshToken and tokenExpiresAt to Platform model"
```

---

### Task 3: Core Google library

**Files:**
- Create: `lib/google.ts`
- Create: `lib/__tests__/google.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/google.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { starRatingToNumber, GoogleDisconnectedError, getGoogleOAuthUrl } from '../google'

describe('starRatingToNumber', () => {
  it('maps ONE through FIVE to 1-5', () => {
    expect(starRatingToNumber('ONE')).toBe(1)
    expect(starRatingToNumber('TWO')).toBe(2)
    expect(starRatingToNumber('THREE')).toBe(3)
    expect(starRatingToNumber('FOUR')).toBe(4)
    expect(starRatingToNumber('FIVE')).toBe(5)
  })

  it('defaults to 3 for unknown values', () => {
    expect(starRatingToNumber('UNKNOWN')).toBe(3)
    expect(starRatingToNumber('')).toBe(3)
  })
})

describe('GoogleDisconnectedError', () => {
  it('is an Error subclass with correct name', () => {
    const err = new GoogleDisconnectedError()
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('GoogleDisconnectedError')
    expect(err.message).toContain('disconnected')
  })
})

describe('getGoogleOAuthUrl', () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret'
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback'
  })

  it('returns a Google accounts URL with required params', () => {
    const url = getGoogleOAuthUrl('my-state')
    expect(url).toContain('accounts.google.com')
    expect(url).toContain('state=my-state')
    expect(url).toContain('access_type=offline')
    expect(url).toContain('prompt=consent')
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npx vitest run lib/__tests__/google.test.ts
```

Expected: FAIL with "Cannot find module '../google'"

- [ ] **Step 3: Create lib/google.ts**

```typescript
import { google } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'
import { db } from '@/lib/db'
import type { Platform } from '@prisma/client'

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
    access_token: platform.accessToken ?? undefined,
    refresh_token: platform.refreshToken ?? undefined,
    expiry_date: platform.tokenExpiresAt?.getTime() ?? undefined,
  })

  const expiresAt = platform.tokenExpiresAt?.getTime() ?? 0
  const fiveMinutes = 5 * 60 * 1000

  if (Date.now() >= expiresAt - fiveMinutes) {
    try {
      const { credentials } = await client.refreshAccessToken()
      await db.platform.update({
        where: { id: platform.id },
        data: {
          accessToken: credentials.access_token ?? undefined,
          tokenExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
        },
      })
      client.setCredentials(credentials)
    } catch {
      await db.platform.update({
        where: { id: platform.id },
        data: { isConnected: false },
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
    } catch {
      // Skip accounts with no location access
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
  const reviews: GoogleReview[] = []
  let pageToken: string | undefined

  do {
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
    }>({ url })

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
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run lib/__tests__/google.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/google.ts lib/__tests__/google.test.ts
git commit -m "feat: add Google OAuth and Business Profile API library"
```

---

### Task 4: OAuth initiation route

**Files:**
- Create: `app/api/auth/google/route.ts`

- [ ] **Step 1: Create the route**

```typescript
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { getGoogleOAuthUrl } from '@/lib/google'
import crypto from 'crypto'

export async function GET(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const returnTo = url.searchParams.get('returnTo') ?? '/dashboard/settings?tab=platforms'

  const nonce = crypto.randomBytes(16).toString('hex')
  const state = Buffer.from(JSON.stringify({ nonce, returnTo })).toString('base64url')

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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/google/route.ts
git commit -m "feat: add Google OAuth initiation route"
```

---

### Task 5: OAuth callback route

**Files:**
- Create: `app/api/auth/google/callback/route.ts`

- [ ] **Step 1: Create the callback route**

```typescript
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
      const noLocUrl = new URL(parsedState.returnTo, req.url)
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

    return NextResponse.redirect(new URL(parsedState.returnTo, req.url))
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(fallback)
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/google/callback/route.ts
git commit -m "feat: add Google OAuth callback route with CSRF protection and token storage"
```

---

### Task 6: Real review sync

**Files:**
- Modify: `app/api/reviews/fetch/route.ts`

- [ ] **Step 1: Replace the route with real sync logic**

Replace the entire file contents:

```typescript
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'
import { checkRateLimit } from '@/lib/redis'
import { getOAuthClient, fetchGoogleReviews, GoogleDisconnectedError } from '@/lib/google'

export async function POST() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const allowed = await checkRateLimit(`reviews:fetch:${restaurant.id}`, 1, 600)
  if (!allowed) return NextResponse.json({ error: 'Rate limited. Try again in 10 minutes.' }, { status: 429 })

  const googlePlatform = await db.platform.findUnique({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: 'GOOGLE' } },
  })

  if (!googlePlatform?.isConnected || !googlePlatform.externalId) {
    return NextResponse.json(
      { error: 'Google not connected. Connect your Google Business account in Settings.' },
      { status: 400 },
    )
  }

  try {
    const client = await getOAuthClient(googlePlatform)
    const googleReviews = await fetchGoogleReviews(client, googlePlatform.externalId)

    let newCount = 0
    let updatedCount = 0

    for (const r of googleReviews) {
      const existing = await db.review.findUnique({
        where: { platform_externalId: { platform: 'GOOGLE', externalId: r.externalId } },
      })

      if (existing) {
        await db.review.update({
          where: { id: existing.id },
          data: { rating: r.rating, reviewText: r.reviewText, authorName: r.authorName },
        })
        updatedCount++
      } else {
        await db.review.create({
          data: {
            restaurantId: restaurant.id,
            platform: 'GOOGLE',
            externalId: r.externalId,
            rating: r.rating,
            reviewText: r.reviewText,
            authorName: r.authorName,
            isDelivery: false,
            reviewDate: r.reviewDate,
          },
        })
        newCount++
      }
    }

    await db.platform.update({
      where: { id: googlePlatform.id },
      data: { lastSyncedAt: new Date() },
    })

    return NextResponse.json({ synced: newCount, updated: updatedCount })
  } catch (err) {
    if (err instanceof GoogleDisconnectedError) {
      return NextResponse.json(
        { error: 'Google account disconnected. Please reconnect in Settings.' },
        { status: 401 },
      )
    }
    console.error('Review sync error:', err)
    return NextResponse.json({ error: 'Failed to sync reviews. Please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/reviews/fetch/route.ts
git commit -m "feat: replace mock review sync with real Google Business Profile API calls"
```

---

### Task 7: Google reply posting + confirmation modal

**Files:**
- Modify: `app/api/reviews/respond/route.ts`
- Modify: `components/dashboard/ResponseDraft.tsx`

- [ ] **Step 1: Update the respond route to support postToGoogle**

Replace the entire file:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'
import { getOAuthClient, postGoogleReply, GoogleDisconnectedError } from '@/lib/google'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const { reviewId, finalText, action, postToGoogle } = await req.json()

  const review = await db.review.findFirst({
    where: { id: reviewId, restaurantId: restaurant.id },
    include: { response: true },
  })
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'dismiss') {
    if (review.response) {
      await db.reviewResponse.update({ where: { id: review.response.id }, data: { status: 'DISMISSED' } })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'approve') {
    if (review.response) {
      await db.reviewResponse.update({ where: { id: review.response.id }, data: { finalText, status: 'POSTED' } })
    } else {
      await db.reviewResponse.create({ data: { reviewId, draftText: finalText, finalText, status: 'POSTED' } })
    }

    if (postToGoogle && review.platform === 'GOOGLE') {
      const googlePlatform = await db.platform.findUnique({
        where: { restaurantId_name: { restaurantId: restaurant.id, name: 'GOOGLE' } },
      })

      if (googlePlatform?.isConnected && googlePlatform.externalId) {
        try {
          const client = await getOAuthClient(googlePlatform)
          await postGoogleReply(client, googlePlatform.externalId, review.externalId, finalText)
          return NextResponse.json({ ok: true, posted: true })
        } catch (err) {
          if (err instanceof GoogleDisconnectedError) {
            return NextResponse.json({ ok: true, posted: false, warning: 'Saved locally — reconnect Google to post.' })
          }
          const warning = (err as any)?.response?.data?.error?.message?.includes('already')
            ? 'This review already has a reply on Google.'
            : 'Saved locally — failed to post to Google. Please try again.'
          return NextResponse.json({ ok: true, posted: false, warning })
        }
      }
    }

    return NextResponse.json({ ok: true, posted: false })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
```

- [ ] **Step 2: Update ResponseDraft to add a confirmation modal**

Replace the entire file:

```typescript
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface ResponseDraftProps {
  reviewId: string
  draft: string
  onApprove: (reviewId: string, finalText: string) => Promise<void>
  onDismiss: (reviewId: string) => Promise<void>
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-2">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-orange"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

export function ResponseDraft({ reviewId, draft, onApprove, onDismiss }: ResponseDraftProps) {
  const [text, setText] = useState(draft)
  const [loading, setLoading] = useState<'approve' | 'dismiss' | null>(null)
  const [posted, setPosted] = useState(false)
  const [showTyping, setShowTyping] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowTyping(false), 1000)
    return () => clearTimeout(t)
  }, [])

  if (posted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-lg bg-green-light border border-green/30 p-4 flex items-center gap-3"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="text-green text-lg"
        >
          ✓
        </motion.span>
        <p className="text-sm text-green font-medium">Response approved and posted.</p>
      </motion.div>
    )
  }

  return (
    <>
      {showConfirm && (
        <Modal
          title="Approve this reply?"
          onClose={() => setShowConfirm(false)}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={loading === 'approve'}
                onClick={async () => {
                  setShowConfirm(false)
                  setLoading('approve')
                  await onApprove(reviewId, text)
                  setPosted(true)
                  setLoading(null)
                }}
              >
                {loading === 'approve' ? 'Posting...' : 'Confirm & post'}
              </Button>
            </>
          }
        >
          <p className="text-sm text-text-muted mb-3">
            Your reply will be saved and posted publicly to your review platform.
          </p>
          <div className="rounded-lg bg-cream border border-border p-3 text-sm text-charcoal leading-relaxed">
            {text}
          </div>
        </Modal>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border-l-4 border border-orange/30 border-l-orange bg-orange-light p-4"
      >
        <p className="text-xs font-medium text-orange uppercase tracking-wide mb-2">AI Draft</p>
        <AnimatePresence mode="wait">
          {showTyping ? (
            <motion.div key="typing" exit={{ opacity: 0 }}>
              <TypingDots />
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <textarea
                rows={4}
                value={text}
                onChange={e => setText(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-brown focus:outline-none focus:ring-2 focus:ring-orange/20 mb-3"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={loading !== null}
                  onClick={() => setShowConfirm(true)}
                >
                  Approve & Post
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={loading !== null}
                  onClick={async () => {
                    setLoading('dismiss')
                    await onDismiss(reviewId)
                    setLoading(null)
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/reviews/respond/route.ts components/dashboard/ResponseDraft.tsx
git commit -m "feat: post approved replies to Google Business Profile with confirmation modal"
```

---

### Task 8: Onboarding connect page — real OAuth

**Files:**
- Modify: `app/onboarding/connect/page.tsx`

- [ ] **Step 1: Update the connect page to use real Google OAuth**

Replace the entire file:

```typescript
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/onboarding/StepIndicator'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const PLATFORMS = [
  { id: 'GOOGLE', label: 'Google', icon: '🔵', required: true },
  { id: 'YELP', label: 'Yelp', icon: '🔴' },
  { id: 'TRIPADVISOR', label: 'TripAdvisor', icon: '🟢' },
  { id: 'DOORDASH', label: 'DoorDash', icon: '🛵', comingSoon: true },
  { id: 'UBEREATS', label: 'Uber Eats', icon: '🚗', comingSoon: true },
  { id: 'GRUBHUB', label: 'Grubhub', icon: '🟠', comingSoon: true },
]

export default function ConnectStep() {
  const router = useRouter()
  const [connected, setConnected] = useState<Set<string>>(new Set())
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const connectedParam = params.get('connected')
    if (connectedParam) setConnected(new Set([connectedParam]))
    const errorParam = params.get('error')
    if (errorParam === 'google_no_location') {
      setError('No Google Business location found on that account. Make sure you manage a verified location.')
    } else if (errorParam === 'google_denied') {
      setError('Google connection was cancelled.')
    } else if (errorParam === 'google_failed') {
      setError('Google connection failed. Please try again.')
    }
  }, [])

  function connectGoogle() {
    const returnTo = encodeURIComponent('/onboarding/connect?connected=GOOGLE')
    window.location.href = `/api/auth/google?returnTo=${returnTo}`
  }

  async function connectManual(platformId: string, externalId?: string) {
    await fetch('/api/onboarding/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: platformId, externalId }),
    })
    setConnected(prev => new Set(prev).add(platformId))
  }

  async function handleContinue() {
    if (!connected.has('GOOGLE')) { setError('Please connect Google to continue.'); return }
    setLoading(true)
    router.push('/onboarding/voice')
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 flex justify-center"><StepIndicator currentStep={2} /></div>
      <Card>
        <h1 className="mb-1 text-xl font-semibold text-charcoal">Connect your review platforms</h1>
        <p className="mb-6 text-sm text-text-muted">All your reviews, one place.</p>
        <div className="flex flex-col gap-3 mb-6">
          {PLATFORMS.map(p => (
            <div
              key={p.id}
              className={cn(
                'flex items-center justify-between rounded-lg border p-4',
                connected.has(p.id) ? 'border-green bg-green-light' : 'border-border bg-white',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{p.icon}</span>
                <span className="font-medium text-charcoal text-sm">{p.label}</span>
                {p.required && <Badge variant="orange">Required</Badge>}
                {p.comingSoon && <Badge variant="gray">Coming soon</Badge>}
              </div>
              {!p.comingSoon && (
                connected.has(p.id)
                  ? <span className="text-xs text-green font-medium">✓ Connected</span>
                  : p.id === 'GOOGLE'
                    ? <Button size="sm" onClick={connectGoogle}>Connect with Google</Button>
                    : <div className="flex gap-2">
                        <input
                          className="rounded border border-border px-3 py-1.5 text-xs w-44"
                          placeholder="Paste listing URL"
                          value={inputs[p.id] || ''}
                          onChange={e => setInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                        />
                        <Button size="sm" onClick={() => connectManual(p.id, inputs[p.id])}>Save</Button>
                      </div>
              )}
            </div>
          ))}
        </div>
        {error && <p className="mb-4 text-sm text-red-dark">{error}</p>}
        <Button size="lg" className="w-full" onClick={handleContinue} disabled={loading}>
          Continue →
        </Button>
        <button
          className="mt-3 w-full text-center text-sm text-text-lighter hover:text-orange"
          onClick={() => router.push('/onboarding/voice')}
        >
          Skip for now
        </button>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/onboarding/connect/page.tsx
git commit -m "feat: connect onboarding page to real Google OAuth flow"
```

---

### Task 9: Settings PlatformsTab — real OAuth + error display

**Files:**
- Modify: `app/dashboard/settings/_components/PlatformsTab.tsx`

- [ ] **Step 1: Update PlatformsTab to use real Google OAuth and display errors**

Replace the entire file:

```typescript
'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface PlatformData {
  name: string
  isConnected: boolean
  lastSyncedAt: string | null
}

interface PlatformsTabProps {
  platforms: PlatformData[]
  onToast: (message: string, type: 'success' | 'error') => void
}

const PLATFORM_META: Record<string, { label: string; emoji: string; bg: string }> = {
  GOOGLE:      { label: 'Google Business', emoji: 'G', bg: 'bg-blue-50' },
  YELP:        { label: 'Yelp',            emoji: 'Y', bg: 'bg-orange-light' },
  TRIPADVISOR: { label: 'TripAdvisor',     emoji: 'T', bg: 'bg-green-light' },
  FACEBOOK:    { label: 'Facebook',        emoji: 'F', bg: 'bg-blue-50' },
}

const ALL_PLATFORMS = ['GOOGLE', 'YELP', 'TRIPADVISOR', 'FACEBOOK']

const ERROR_MESSAGES: Record<string, string> = {
  google_denied: 'Google connection was cancelled.',
  google_no_location: 'No Google Business location found on that account.',
  google_failed: 'Google connection failed. Please try again.',
}

function formatSync(ts: string | null): string {
  if (!ts) return 'Never synced'
  const diff = Date.now() - new Date(ts).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Synced recently'
  if (h < 24) return `Synced ${h}h ago`
  return `Synced ${Math.floor(h / 24)}d ago`
}

export function PlatformsTab({ platforms: initial, onToast }: PlatformsTabProps) {
  const [platforms, setPlatforms] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    if (errorParam && ERROR_MESSAGES[errorParam]) {
      onToast(ERROR_MESSAGES[errorParam], 'error')
    }
  }, [onToast])

  function getState(name: string): PlatformData {
    return platforms.find(p => p.name === name) ?? { name, isConnected: false, lastSyncedAt: null }
  }

  async function toggle(name: string, isConnected: boolean) {
    if (name === 'GOOGLE' && !isConnected) {
      const returnTo = encodeURIComponent('/dashboard/settings?tab=platforms')
      window.location.href = `/api/auth/google?returnTo=${returnTo}`
      return
    }

    setBusy(name)
    try {
      if (isConnected) {
        const res = await fetch(`/api/settings/platforms/${name}`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
        setPlatforms(prev => prev.map(p => p.name === name ? { ...p, isConnected: false } : p))
        onToast(`${PLATFORM_META[name]?.label ?? name} disconnected`, 'success')
      } else {
        const res = await fetch('/api/settings/platforms/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: name }),
        })
        if (!res.ok) throw new Error()
        setPlatforms(prev => {
          const exists = prev.find(p => p.name === name)
          if (exists) return prev.map(p => p.name === name ? { ...p, isConnected: true } : p)
          return [...prev, { name, isConnected: true, lastSyncedAt: null }]
        })
        onToast(`${PLATFORM_META[name]?.label ?? name} connected`, 'success')
      }
    } catch {
      onToast('Something went wrong', 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-charcoal">Connected platforms</h2>
      <p className="mb-5 text-xs text-text-lighter">Manage which review platforms Stir syncs with.</p>

      <div className="flex flex-col divide-y divide-border">
        {ALL_PLATFORMS.map(name => {
          const p = getState(name)
          const meta = PLATFORM_META[name]
          return (
            <div key={name} className="flex items-center gap-3 py-3">
              <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-charcoal', meta.bg)}>
                {meta.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal">{meta.label}</p>
                <p className="text-xs text-text-lighter">{formatSync(p.lastSyncedAt)}</p>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  p.isConnected ? 'bg-green-light text-green' : 'bg-border text-text-lighter',
                )}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', p.isConnected ? 'bg-green' : 'bg-text-lighter')} />
                  {p.isConnected ? 'Connected' : 'Disconnected'}
                </span>
                <Button
                  variant={p.isConnected ? 'secondary' : 'primary'}
                  size="sm"
                  disabled={busy === name}
                  onClick={() => toggle(name, p.isConnected)}
                >
                  {busy === name ? '…' : p.isConnected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/settings/_components/PlatformsTab.tsx
git commit -m "feat: wire settings PlatformsTab to real Google OAuth with error feedback"
```

---

### Task 10: Bug fix — replace alert() with Toast in reviews page

**Files:**
- Modify: `app/dashboard/reviews/page.tsx`

- [ ] **Step 1: Replace all alert() calls with Toast and update approveDraft to send postToGoogle**

Replace the entire file:

```typescript
'use client'
import { useEffect, useState, useCallback } from 'react'
import { ReviewCard } from '@/components/dashboard/ReviewCard'
import { ResponseDraft } from '@/components/dashboard/ResponseDraft'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'

interface Review {
  id: string
  platform: string
  rating: number
  reviewText: string
  authorName: string
  reviewDate: string
  isDelivery: boolean
  response?: { id: string; draftText: string; status: string } | null
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [activeDrafts, setActiveDrafts] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ platform: '', rating: '' })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadReviews = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (filter.platform) params.set('platform', filter.platform)
    if (filter.rating) params.set('rating', filter.rating)
    const res = await fetch(`/api/reviews?${params}`)
    const data = await res.json()
    setReviews(data.reviews ?? [])
    setTotalPages(data.pages ?? 1)
    setLoading(false)
  }, [page, filter])

  useEffect(() => { loadReviews() }, [loadReviews])

  async function requestDraft(reviewId: string) {
    const res = await fetch('/api/ai/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId }),
    })
    const data = await res.json()
    if (data.error === 'UPGRADE_REQUIRED') {
      setToast({ message: 'Free plan: 3 AI drafts per month reached. Upgrade to continue.', type: 'error' })
      return
    }
    if (data.error === 'NO_VOICE_SAMPLES') {
      setToast({ message: 'Complete your voice setup before generating drafts.', type: 'error' })
      return
    }
    if (data.draft) {
      setActiveDrafts(prev => ({ ...prev, [reviewId]: data.draft }))
    } else if (!data.error) {
      setToast({ message: 'Could not generate draft. Please try again.', type: 'error' })
    }
  }

  async function approveDraft(reviewId: string, finalText: string) {
    const res = await fetch('/api/reviews/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, finalText, action: 'approve', postToGoogle: true }),
    })
    const data = await res.json()
    if (data.warning) setToast({ message: data.warning, type: 'error' })
    setActiveDrafts(prev => { const n = { ...prev }; delete n[reviewId]; return n })
    loadReviews()
  }

  async function dismissDraft(reviewId: string) {
    await fetch('/api/reviews/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, action: 'dismiss' }),
    })
    setActiveDrafts(prev => { const n = { ...prev }; delete n[reviewId]; return n })
    loadReviews()
  }

  async function syncReviews() {
    const res = await fetch('/api/reviews/fetch', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setToast({ message: data.error ?? 'Sync failed', type: 'error' })
      return
    }
    setToast({ message: `Synced ${data.synced} new, ${data.updated} updated`, type: 'success' })
    loadReviews()
  }

  const PLATFORMS = ['', 'GOOGLE', 'YELP', 'TRIPADVISOR']
  const RATINGS = ['', '1', '2', '3', '4', '5']

  return (
    <div className="p-8">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">Reviews</h1>
        <Button size="sm" variant="secondary" onClick={syncReviews}>Sync reviews</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {PLATFORMS.map(p => (
          <button
            key={p}
            onClick={() => { setPage(1); setFilter(f => ({ ...f, platform: p })) }}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${filter.platform === p ? 'bg-orange text-white border-orange' : 'bg-white border-border text-text-muted hover:border-orange hover:text-orange'}`}
          >
            {p || 'All platforms'}
          </button>
        ))}
        {RATINGS.map(r => (
          <button
            key={r}
            onClick={() => { setPage(1); setFilter(f => ({ ...f, rating: r })) }}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${filter.rating === r ? 'bg-orange text-white border-orange' : 'bg-white border-border text-text-muted hover:border-orange hover:text-orange'}`}
          >
            {r ? `${r}★` : 'All ratings'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl border border-border bg-white animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-text-muted text-sm">No reviews found. Connect Google in Settings and sync to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map(review => (
            <div key={review.id}>
              <ReviewCard review={review} onDraftRequest={requestDraft} />
              {activeDrafts[review.id] && (
                <div className="mt-2 ml-4">
                  <ResponseDraft
                    reviewId={review.id}
                    draft={activeDrafts[review.id]}
                    onApprove={approveDraft}
                    onDismiss={dismissDraft}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 mt-6">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <span className="text-sm text-text-muted self-center">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/reviews/page.tsx
git commit -m "fix: replace alert() with Toast in reviews page, add skeleton loader and better empty state"
```

---

### Task 11: Bug fix — fix voice type mismatch in VoiceTab

**Files:**
- Modify: `app/dashboard/settings/_components/VoiceTab.tsx`

- [ ] **Step 1: Update TYPE_OPTIONS, TYPE_LABELS, TYPE_VARIANT, and EMPTY_FORM**

In `VoiceTab.tsx`, replace the constants block (lines 19–26) with:

```typescript
const TYPE_OPTIONS = [
  'positive_5star',
  'wait_complaint',
  'food_complaint',
  'price_complaint',
  'service_complaint',
  'mixed',
]

const TYPE_LABELS: Record<string, string> = {
  positive_5star: 'Positive (5★)',
  wait_complaint: 'Wait complaint',
  food_complaint: 'Food complaint',
  price_complaint: 'Price complaint',
  service_complaint: 'Service complaint',
  mixed: 'Mixed',
}

const TYPE_VARIANT: Record<string, 'green' | 'red' | 'amber' | 'gray'> = {
  positive_5star: 'green',
  wait_complaint: 'red',
  food_complaint: 'red',
  price_complaint: 'amber',
  service_complaint: 'red',
  mixed: 'gray',
}

const EMPTY_FORM = { reviewType: 'positive_5star', sampleReview: '', ownerResponse: '' }
```

- [ ] **Step 2: Update all places that display a type label**

Find the Badge that renders `s.reviewType`:

```typescript
// Old (line ~158):
<Badge variant={TYPE_VARIANT[s.reviewType] ?? 'gray'}>
  {s.reviewType.charAt(0).toUpperCase() + s.reviewType.slice(1)}
</Badge>
```

Replace with:

```typescript
<Badge variant={TYPE_VARIANT[s.reviewType] ?? 'gray'}>
  {TYPE_LABELS[s.reviewType] ?? s.reviewType}
</Badge>
```

- [ ] **Step 3: Update both `<select>` option labels in the edit form and add form**

Find both instances of:

```typescript
{TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
```

Replace both with:

```typescript
{TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/settings/_components/VoiceTab.tsx
git commit -m "fix: align VoiceTab review type options with onboarding types"
```

---

### Task 12: Bug fix — insights type filter

**Files:**
- Modify: `app/dashboard/insights/page.tsx`

- [ ] **Step 1: Add filter state and filter UI to insights page**

Replace the entire file:

```typescript
'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Insight {
  id: string
  type: 'ALERT' | 'TIP' | 'DELIVERY_GAP'
  title: string
  body: string
  reviewCount: number
  platforms: string[]
  isRead: boolean
}

const TYPE_META = {
  ALERT: { label: 'Alert', variant: 'red' as const },
  TIP: { label: 'Tip', variant: 'orange' as const },
  DELIVERY_GAP: { label: 'Delivery', variant: 'amber' as const },
}

const FILTER_OPTIONS = ['ALL', 'ALERT', 'TIP', 'DELIVERY_GAP'] as const
type FilterOption = typeof FILTER_OPTIONS[number]

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterOption>('ALL')

  async function loadInsights() {
    const res = await fetch('/api/insights')
    const data = await res.json()
    setInsights(data.insights ?? [])
  }

  useEffect(() => { loadInsights() }, [])

  async function generate() {
    setGenerating(true)
    setError('')
    const res = await fetch('/api/ai/insights', { method: 'POST' })
    const data = await res.json()
    if (res.ok) setInsights(data.insights ?? [])
    else setError(data.error ?? 'Something went wrong')
    setGenerating(false)
  }

  async function markRead(id: string) {
    await fetch(`/api/insights/${id}/read`, { method: 'POST' })
    setInsights(prev => prev.map(i => i.id === id ? { ...i, isRead: true } : i))
  }

  const filtered = filter === 'ALL' ? insights : insights.filter(i => i.type === filter)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">Insights</h1>
        <Button size="sm" onClick={generate} disabled={generating}>
          {generating ? 'Generating...' : 'Regenerate insights'}
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-dark">{error}</p>}

      <div className="flex gap-2 mb-5">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${filter === f ? 'bg-orange text-white border-orange' : 'bg-white border-border text-text-muted hover:border-orange hover:text-orange'}`}
          >
            {f === 'ALL' ? 'All' : f === 'DELIVERY_GAP' ? 'Delivery' : TYPE_META[f].label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-text-muted text-sm mb-4">
            {insights.length === 0 ? 'No insights yet.' : 'No insights match this filter.'}
          </p>
          {insights.length === 0 && (
            <Button onClick={generate} disabled={generating}>
              {generating ? 'Generating...' : 'Generate insights'}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(insight => (
            <div
              key={insight.id}
              className={`rounded-xl border border-border bg-white p-5 ${insight.isRead ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={TYPE_META[insight.type].variant}>{TYPE_META[insight.type].label}</Badge>
                    <span className="text-xs text-text-lighter">
                      {insight.reviewCount} reviews · {insight.platforms.join(', ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-charcoal mb-1">{insight.title}</h3>
                  <p className="text-sm text-text-muted">{insight.body}</p>
                </div>
                {!insight.isRead && (
                  <button
                    className="text-xs text-text-lighter hover:text-orange shrink-0"
                    onClick={() => markRead(insight.id)}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/insights/page.tsx
git commit -m "fix: add type filter to insights page and improve empty state"
```

---

### Task 13: Bug fix — upgrade param on dashboard + update README

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `README.md`

- [ ] **Step 1: Handle ?upgrade= query param on the dashboard**

`DashboardPage` is a server component that receives `searchParams`. Add a banner when an upgrade param is present.

At the top of `app/dashboard/page.tsx`, add `searchParams` to the function signature, then add the upgrade banner inside the JSX. Replace the function signature and add the banner:

```typescript
// Change the function signature from:
export default async function DashboardPage() {

// To:
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { upgrade?: string }
}) {
```

Then, after the `{!voiceComplete && ...}` block, add:

```typescript
      {searchParams.upgrade && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-orange/40 bg-orange-light px-5 py-4">
          <div>
            <p className="font-medium text-orange text-sm">Upgrade to {searchParams.upgrade}</p>
            <p className="text-xs text-orange/80 mt-0.5">Paid plans are coming soon. You&apos;ll be notified when they launch.</p>
          </div>
        </div>
      )}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Rewrite README.md**

Replace the entire file with:

```markdown
# Stir

AI-powered restaurant reputation management. Sync Google reviews, generate voice-matched reply drafts, and post responses — all from one dashboard.

## Tech Stack

- **Next.js 14** (App Router) — frontend + API routes
- **Prisma + PostgreSQL** — database
- **Clerk** — authentication
- **Anthropic Claude** — AI draft generation and insights
- **Upstash Redis** — rate limiting
- **googleapis** — Google Business Profile integration

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd stir
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

### 3. Google Cloud setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable these APIs:
   - My Business Account Management API
   - My Business Business Information API
4. Go to **Credentials** → **Create OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID and Secret to `.env.local`

> Note: Google restricts Business Profile API access. Add your Google account as a test user in OAuth consent screen settings during development.

### 4. Database

```bash
npx prisma migrate dev
npx prisma generate
```

Optionally seed test data:

```bash
npx prisma db seed
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key flows

- **Onboarding** (`/onboarding`) — restaurant setup, connect Google, train voice, pick plan
- **Dashboard** (`/dashboard`) — score overview, recent reviews, top insights
- **Reviews** (`/dashboard/reviews`) — AI draft generation, approve + post to Google
- **Insights** (`/dashboard/insights`) — AI-generated analysis with type filters
- **Settings** (`/dashboard/settings`) — restaurant info, platform connections, voice samples

## Tests

```bash
npx vitest run
```
```

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/page.tsx README.md
git commit -m "fix: handle upgrade query param on dashboard, rewrite README with real setup instructions"
```

---

## Done

All 13 tasks complete. The app now has:
- Real Google OAuth connection flow with CSRF protection
- Live review sync from Google Business Profile
- Confirmed reply posting to Google
- Persistent OAuth tokens with auto-refresh
- All identified bugs fixed (Toast, voice types, insights filter, upgrade param, README)
