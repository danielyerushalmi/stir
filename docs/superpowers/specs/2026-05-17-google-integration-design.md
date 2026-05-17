# Google Business Profile Integration — Design Spec

**Date:** 2026-05-17
**Status:** Approved

---

## Overview

Integrate the Google Business Profile API to enable real review syncing and reply posting for connected restaurants. This replaces the existing mock sync implementation and adds a full OAuth 2.0 connection flow.

**Library:** `googleapis` npm package (official Google Node.js client)
**Scope:** `https://www.googleapis.com/auth/business.manage`

---

## Architecture

Four discrete pieces:

1. **OAuth connection** — routes that initiate and handle the Google consent flow
2. **Token management** — storage, auto-refresh, and revocation handling in `lib/google.ts`
3. **Review sync** — real paginated fetch replacing the mock in `/api/reviews/fetch`
4. **Reply posting** — posting approved drafts back to Google via `/api/reviews/respond`

---

## Schema Changes

Add two fields to the `Platform` model:

```prisma
model Platform {
  // existing fields...
  refreshToken   String?
  tokenExpiresAt DateTime?
}
```

`accessToken` already exists. `externalId` will store the Google location resource name (e.g. `accounts/123/locations/456`).

---

## New Files

### `lib/google.ts`

Core OAuth + API functions:

- `getGoogleOAuthUrl(returnTo: string): string` — builds consent URL with `access_type: 'offline'`, `prompt: 'consent'`, and a signed state param encoding `returnTo`
- `exchangeCodeForTokens(code: string): TokenSet` — exchanges auth code for access + refresh tokens
- `getOAuthClient(platform: Platform): OAuth2Client` — builds client from stored tokens, auto-refreshes if within 5 minutes of expiry, updates DB with new token + expiry
- `fetchGoogleReviews(platform: Platform, restaurantId: string): Review[]` — paginated fetch of all reviews for the stored location
- `postGoogleReply(platform: Platform, reviewExternalId: string, text: string): void` — posts reply to Google

Token refresh failure throws a typed `GoogleDisconnectedError` — callers catch this and mark the Platform as `isConnected: false`.

### `app/api/auth/google/route.ts` (GET)

Generates a random nonce, stores it in a signed HTTP-only cookie (`google_oauth_state`), returns a redirect to the Google consent URL. Accepts `?returnTo=` query param (onboarding or settings) encoded in state.

### `app/api/auth/google/callback/route.ts` (GET)

1. Verifies `state` against cookie (CSRF check)
2. Exchanges `code` for tokens via `exchangeCodeForTokens()`
3. Calls Google API to list locations on the account — if multiple locations, stores all and marks the first match by city name, or prompts user to pick (see UI section)
4. Upserts Platform record: `name: "GOOGLE"`, `isConnected: true`, `accessToken`, `refreshToken`, `tokenExpiresAt`, `externalId` (location resource name)
5. Clears state cookie
6. Redirects to `returnTo` URL

---

## Modified Files

### `prisma/schema.prisma`
Add `refreshToken` and `tokenExpiresAt` to Platform model. Run `prisma migrate dev`.

### `app/api/reviews/fetch/route.ts`
Replace mock with:
1. Get Google Platform record for restaurant (isConnected check)
2. Call `fetchGoogleReviews()` from `lib/google.ts`
3. Upsert each review using `@@unique([platform, externalId])` constraint
4. Update `lastSyncedAt`
5. Return `{ synced: newCount, updated: updatedCount }`

Deleted reviews on Google are left in DB (preserves history). Changed review text is updated on upsert.

### `app/api/reviews/respond/route.ts`
Add `postToGoogle: boolean` to request body:
1. Save `finalText` to ReviewResponse, set `status: "POSTED"`
2. If `postToGoogle: true`: call `postGoogleReply()` from `lib/google.ts`
3. On Google API error: roll back status to `"DRAFT"`, return error to UI
4. Return success

### `app/onboarding/connect/page.tsx`
"Connect Google" button navigates to `/api/auth/google?returnTo=/onboarding/connect` instead of calling the mock endpoint.

### `app/dashboard/settings/_components/PlatformsTab.tsx`
Connect button for Google navigates to `/api/auth/google?returnTo=/dashboard/settings?tab=platforms`.

### `components/dashboard/ResponseDraft.tsx`
"Approve & Post" button opens a confirmation Modal:
- Shows final reply text
- Warning: "This will post publicly to your Google listing"
- Confirm → fires respond API with `postToGoogle: true`
- Cancel → no-op

---

## OAuth Flow (step by step)

1. User clicks "Connect Google"
2. Browser navigates to `/api/auth/google?returnTo=<page>`
3. Server sets `google_oauth_state` cookie, redirects to Google consent screen
4. User approves `business.manage` scope
5. Google redirects to `/api/auth/google/callback?code=...&state=...`
6. Server verifies state, exchanges code, fetches location, saves tokens
7. Redirect to `returnTo` — platform now shows as Connected

**Always pass `prompt: 'consent'`** so Google issues a fresh refresh token on reconnect (Google only returns refresh_token on first consent otherwise).

---

## Error Handling

| Error | Handling |
|---|---|
| Token expired | Auto-refresh silently, retry once |
| Refresh token invalid (revoked) | Mark `isConnected: false`, return `google_disconnected` error, UI shows "Reconnect Google" prompt |
| `PERMISSION_DENIED` | "Your Google account doesn't have permission to manage this listing" |
| `NOT_FOUND` | Mark platform disconnected |
| `RESOURCE_EXHAUSTED` (rate limit) | Return 429, existing rate limit UX handles it |
| Already has a reply on Google | "This review already has a reply on Google" |
| Reply too long | Client-side validation at 4096 chars before posting |
| Platform disconnected mid-flow | Save to DB as DRAFT, show "Saved locally — reconnect Google to post" |
| Multiple Google locations | Show location picker UI in callback redirect before saving |
| No location found | Show error, don't save tokens, prompt retry |

---

## Bug Fixes (parallel track)

These are fixed in the same implementation plan but require no design — straight code changes:

1. `alert()` → Toast component in `reviews/page.tsx`
2. Voice type mismatch — align VoiceTab to use same types as onboarding (`positive_5star`, `wait_complaint`, etc.)
3. Empty/loading states — add skeleton loaders to dashboard, reviews, and insights pages
4. Upgrade query param (`?upgrade=STARTER`) — handled on dashboard
5. Insights filtering — add filter by type (ALERT / TIP / DELIVERY_GAP)
6. Missing `.env.example` — add with all required vars documented
7. README — replace boilerplate with real setup instructions

---

## GCP Setup (one-time manual steps)

Before implementation, the developer must:

1. Create a Google Cloud project at console.cloud.google.com
2. Enable "Business Profile API" (search for it in API Library)
3. Create OAuth 2.0 credentials (Web application type)
4. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback` (dev) + production URL
5. Copy Client ID and Client Secret to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
   ```
6. Note: Google restricts Business Profile API access — the app must be submitted for verification before it can be used by users outside the project's test users list

---

## Dependencies

```
npm install googleapis
```

No other new dependencies.
