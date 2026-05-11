# Settings Page — Design Spec
_Date: 2026-05-11_

## Overview

A tabbed settings page at `/dashboard/settings` with four tabs: Restaurant, Platforms, Voice & Tone, and Account. Replaces the current placeholder. All mutations surface a toast on success or error.

---

## Schema Change

`VoiceSample` currently enforces `@@unique([restaurantId, reviewType])`, allowing only one sample per type. Remove this constraint so multiple samples per type are allowed. A Prisma migration is required.

---

## Data

A single `GET /api/settings` endpoint returns everything the page needs in one shot:

```ts
{
  restaurant: { id, name, cuisineType, city, vibe },
  platforms: [{ name, isConnected, lastSyncedAt }],
  voiceSamples: [{ id, reviewType, sampleReview, ownerResponse }],
  subscription: { plan } | null
}
```

---

## API Routes

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/settings` | Fetch all settings data |
| PUT | `/api/settings/restaurant` | Update name, cuisineType, city, vibe |
| POST | `/api/settings/platforms/connect` | Connect a platform (reuses onboarding logic) |
| DELETE | `/api/settings/platforms/[name]` | Disconnect a platform (set isConnected=false) |
| POST | `/api/settings/voice` | Add a new voice sample |
| PUT | `/api/settings/voice/[id]` | Edit an existing voice sample |
| DELETE | `/api/settings/voice/[id]` | Delete a voice sample |
| DELETE | `/api/settings/account` | Delete the user and all data (cascade) |

All routes verify Clerk auth and that the resource belongs to the authenticated user.

---

## Page Component

`app/dashboard/settings/page.tsx` — client component.

- Fetches `GET /api/settings` on mount.
- Holds `activeTab` state (`'restaurant' | 'platforms' | 'voice' | 'account'`).
- Holds `toast` state (`{ message: string; type: 'success' | 'error' } | null`), auto-cleared after 3 s.

---

## Tab: Restaurant

Fields: Name, Cuisine type, City, Vibe & description (textarea). All pre-filled from fetched data.

- "Save changes" button calls `PUT /api/settings/restaurant`.
- On success: toast "Restaurant updated".

---

## Tab: Platforms

Lists all four platforms (Google, Yelp, TripAdvisor, Facebook) with connected/disconnected badge and last-synced time.

- **Connected** → "Disconnect" button → `DELETE /api/settings/platforms/[name]` → badge flips to disconnected.
- **Disconnected** → "Connect" button → `POST /api/settings/platforms/connect` → badge flips to connected. (Still mocked — no real OAuth.)

---

## Tab: Voice & Tone

Lists all stored voice samples as cards. Each card shows: review type badge (Positive / Negative / Neutral), the sample review text, and the owner response.

**Edit flow:** clicking Edit on a card turns it inline-editable (same card, fields become textareas). Save calls `PUT /api/settings/voice/[id]`.

**Delete flow:** clicking Delete on a card shows a small inline confirmation ("Are you sure? Delete / Cancel") before calling `DELETE /api/settings/voice/[id]`.

**Add flow:** "Add a sample" button reveals an add form below the list with: review type selector, sample review textarea, owner response textarea. Save calls `POST /api/settings/voice`.

---

## Tab: Account

Read-only info row: email (from Clerk), plan badge, member-since date.

**Sign out:** `<SignOutButton>` from `@clerk/nextjs` — styled as a secondary button.

**Danger zone** (red-bordered card):
- Delete account row with "Delete account" button.
- Clicking opens a confirmation modal: "This will permanently delete your restaurant, all reviews, voice samples, and your account. Type DELETE to confirm." Input must match exactly before the confirm button enables.
- On confirm: `DELETE /api/settings/account` → Clerk `clerkClient.users.deleteUser(userId)` → redirect to `/`.

---

## New UI Components

**`components/ui/Toast.tsx`** — fixed bottom-right, dark pill, green dot for success / red dot for error. Auto-dismisses after 3 s.

**`components/ui/Modal.tsx`** — centered overlay, backdrop blur. Accepts title, body (children), and footer (action buttons).

---

## Existing Routes Reused

- `POST /api/onboarding/voice` is **not** reused — the new `POST /api/settings/voice` replaces it for the settings context (no upsert-by-type, just create).
- `POST /api/onboarding/connect` logic is duplicated into `POST /api/settings/platforms/connect` for clarity (they now live in different route groups).

---

## What This Does NOT Change

- Onboarding flow is untouched.
- Platform sync and response-posting remain mocked.
- Stripe/billing is out of scope — plan is shown read-only.
