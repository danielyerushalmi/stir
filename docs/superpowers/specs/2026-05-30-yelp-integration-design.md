# Yelp Fusion API Integration — Design Spec

**Date:** 2026-05-30  
**Scope:** Read-only Yelp integration (no response posting via API)  
**Auth:** Bearer token only — `YELP_API_KEY` env var, no per-user OAuth

---

## 1. Data Model

### Prisma — `Restaurant` additions
```
yelpBusinessId  String?
yelpRating      Float?
yelpReviewCount Int?
```

These fields live on `Restaurant`, not `Platform`, because:
- Yelp has no per-user OAuth — there are no tokens to store
- `Platform` is for auth credentials; `yelpRating`/`yelpReviewCount` are restaurant-level facts

A `Platform` record for YELP is still created (`isConnected: true`, `externalId: yelpBusinessId`) so existing platform UI logic works, but semantic data lives on `Restaurant`.

The `Review` model is unchanged. Yelp reviews are stored as `platform: 'YELP'` records, identical in shape to Google reviews.

**Migration:** one Prisma migration adding the 3 nullable fields.

---

## 2. `lib/yelp.ts`

Plain `fetch` client against `https://api.yelp.com/v3/` with `Authorization: Bearer ${YELP_API_KEY}`.

```typescript
getBusinessByName(name: string, location: string): Promise<{
  businessId: string
  rating: number
  reviewCount: number
}>
// → GET /v3/businesses/search?term={name}&location={location}

getBusinessDetails(businessId: string): Promise<{
  rating: number
  reviewCount: number
}>
// → GET /v3/businesses/{id}

getReviews(businessId: string): Promise<Array<{
  externalId: string
  rating: number
  reviewText: string
  authorName: string
  reviewDate: Date
}>>
// → GET /v3/businesses/{id}/reviews (Yelp hard limit: 3 reviews)
```

Throws a typed `YelpApiError` on non-2xx responses, mirroring the `GoogleDisconnectedError` pattern.

**Env vars:** `YELP_API_KEY` added to `.env.local` and `.env.example`.

---

## 3. API Routes

### `POST /api/platforms/yelp/connect`
Body: `{ businessName: string, location: string }`

1. Call `getBusinessByName` → `businessId`, `rating`, `reviewCount`
2. Upsert `Platform` record: `name: 'YELP'`, `isConnected: true`, `externalId: businessId`
3. Update `Restaurant`: set `yelpBusinessId`, `yelpRating`, `yelpReviewCount`
4. Call `getReviews(businessId)` → upsert up to 3 reviews as `Review` records (`platform: 'YELP'`)
5. Return `{ ok: true, rating, reviewCount }`

### `GET /api/platforms/yelp/reviews`
Live-fetches from Yelp API using the stored `restaurant.yelpBusinessId`.  
Returns `{ reviews }` in the same shape as `/api/reviews`.  
Used for on-demand refresh; the main reviews feed uses DB records stored at connect time.

### `POST /api/settings/platforms/connect` (existing route)
Updated to reject `YELP` as a valid platform — Yelp can only be connected via the dedicated `/api/platforms/yelp/connect` endpoint. TripAdvisor and Facebook remain as mock toggles.

---

## 4. Scoring (`lib/scoring.ts`)

### Problem
`calculateOverallScore` currently averages stored review ratings per platform. With only 3 Yelp reviews stored, that average misrepresents the restaurant's true Yelp standing.

### Solution — Option B: `platformAggregates` parameter

```typescript
calculateOverallScore(
  reviews: ReviewForScore[],
  platformAggregates?: Record<string, number>
): number | null
```

When a platform key exists in `platformAggregates`, that value is used directly as the platform's weighted contribution instead of averaging its stored reviews. All other platforms continue averaging as before.

`getScoreResult` fetches `restaurant.yelpRating` alongside reviews and passes `{ YELP: yelpRating }` when it's non-null. Existing tests for `calculateOverallScore` remain valid — the new param is additive.

---

## 5. UI Changes

### Settings > Platforms tab

Yelp row is replaced with a custom section:

**Disconnected state:**
- Two text inputs: business name + city
- "Connect" button → calls `POST /api/platforms/yelp/connect`
- Shows error if business not found

**Connected state:**
- Displays aggregate stats: `"4.2 ★ · 347 reviews"`
- "Disconnect" button → clears `yelpBusinessId`/`yelpRating`/`yelpReviewCount` on Restaurant, sets Platform `isConnected: false`, and deletes all `Review` records where `platform = 'YELP'` for that restaurant

All other platforms (Google, TripAdvisor, Facebook) keep their existing toggle behavior.

### Dashboard reviews feed

`ReviewCard` receives a `platform` prop.

For `platform === 'YELP'`:
- Button label: "Copy AI Response →" (instead of "Draft reply →")
- On click: calls `onDraftRequest(review.id)` → same `/api/ai/draft` flow
- `ResponseDraft` panel appears with the editable AI draft (identical to Google flow)

`ResponseDraft` receives a `platform` prop.

For Yelp, inside `ResponseDraft`:
- "Approve & Post" → "Copy to clipboard"
- On click: `navigator.clipboard.writeText(text)` + "Copied!" confirmation feedback
- No Google API call is made
- Tooltip on button: "Yelp doesn't allow third-party posting — copy this and paste it into Yelp directly."
- "Dismiss" button unchanged

### Dashboard insights page

Below any insight whose `platforms` array includes `'YELP'`, render a small disclaimer:
> "Yelp insights based on 3 most recent reviews."

---

## 6. AI Insights Prompt (`lib/ai.ts`)

In `generateInsights`, after fetching reviews:

```typescript
const hasYelp = reviews.some(r => r.platform === 'YELP')
```

If `hasYelp`, append to the system prompt:
> "Note: Yelp data is limited to the 3 most recent reviews — do not infer long-term patterns from Yelp reviews alone."

---

## Files Touched

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add 3 fields to `Restaurant` |
| `prisma/migrations/...` | New migration |
| `lib/yelp.ts` | New file — Yelp API client |
| `lib/scoring.ts` | Add `platformAggregates` param to `calculateOverallScore`; update `getScoreResult` |
| `lib/ai.ts` | Yelp disclaimer note in insights prompt |
| `app/api/platforms/yelp/connect/route.ts` | New route |
| `app/api/platforms/yelp/reviews/route.ts` | New route |
| `app/api/settings/platforms/connect/route.ts` | Reject YELP |
| `app/dashboard/settings/_components/PlatformsTab.tsx` | Custom Yelp connect UI |
| `app/dashboard/insights/page.tsx` | Yelp disclaimer on insight cards |
| `app/dashboard/reviews/page.tsx` | Pass `platform` to `ReviewCard` |
| `components/dashboard/ReviewCard.tsx` | Conditional label for Yelp |
| `components/dashboard/ResponseDraft.tsx` | Yelp copy-to-clipboard path |
| `.env.example` | Add `YELP_API_KEY` |
| `.env.local` | Add `YELP_API_KEY` (placeholder) |
