# Stir — Phase 1 Design Spec

**Date:** 2026-05-08  
**Scope:** Phase 1 — Core Loop (auth through landing page)  
**Phase 2 (deferred):** Insights generation, Stripe billing, response posting, Settings pages, delivery platforms, cron jobs, email

---

## Overview

Stir is an AI-powered reputation management SaaS for single-location restaurants. It aggregates reviews across Google, Yelp, TripAdvisor, Facebook, DoorDash, Uber Eats, and Grubhub into a unified score plus a separate delivery subscore, drafts responses in the owner's own voice, surfaces actionable insights, and lets owners approve and post responses in one click.

Phase 1 delivers a fully functional, visually polished product: onboarding, dashboard, mock review data, AI draft system, scoring, and the marketing landing page.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | Clerk |
| AI | Anthropic Claude API (Haiku for drafts, Sonnet for insights) |
| Payments | Stripe (Phase 2) |
| Email | Resend (Phase 2) |
| Caching / Rate limiting | Upstash Redis |
| Hosting | Vercel |
| Styling | Tailwind CSS |

---

## Colour System

```css
--orange: #E8630A          /* Primary CTA, buttons, highlights */
--orange-dark: #C4520A     /* Hover state */
--orange-light: #FEF0E7    /* Tinted backgrounds */
--charcoal: #1A1A2E        /* Nav, headlines, dark sections */
--warm-gray: #F9F6F2       /* Page background, alternating sections */
--border: #E8E0D8          /* Card borders, dividers */
--text-muted: #5F5E5A      /* Body copy */
--text-lighter: #888780    /* Labels, metadata */
--green: #2D9B6F           /* Positive scores */
--green-light: #EAF3DE
--amber-light: #FAEEDA     /* Warnings */
--amber-dark: #633806
--red-light: #FCEBEB       /* Negative reviews, low scores */
--red-dark: #A32D2D
```

Font: Inter (Google Fonts). Weights: 400, 500, 600 only.

---

## Project Structure

```
stir/
├── app/
│   ├── (marketing)/page.tsx          ← landing page
│   ├── (auth)/sign-in/page.tsx
│   ├── (auth)/sign-up/page.tsx
│   ├── onboarding/
│   │   ├── page.tsx                  ← step controller
│   │   ├── restaurant/page.tsx       ← step 1
│   │   ├── connect/page.tsx          ← step 2
│   │   ├── voice/page.tsx            ← step 3
│   │   └── plan/page.tsx             ← step 4
│   ├── dashboard/
│   │   ├── layout.tsx                ← app shell with collapsible sidebar
│   │   ├── page.tsx                  ← main dashboard
│   │   ├── reviews/page.tsx
│   │   └── insights/page.tsx
│   └── api/
│       ├── reviews/fetch/route.ts
│       ├── ai/draft/route.ts
│       └── ai/insights/route.ts
├── components/
│   ├── ui/                           ← Button, Card, Badge, Input
│   ├── dashboard/
│   │   ├── Sidebar.tsx               ← collapsible, localStorage state
│   │   ├── ScoreCard.tsx
│   │   ├── ReviewCard.tsx
│   │   ├── ResponseDraft.tsx
│   │   ├── InsightCard.tsx
│   │   └── DeliverySubscore.tsx
│   └── onboarding/
│       ├── StepIndicator.tsx
│       ├── VoiceTrainer.tsx
│       └── PlatformConnector.tsx
├── lib/
│   ├── ai.ts
│   ├── reviews.ts
│   ├── scoring.ts
│   └── redis.ts
├── prisma/schema.prisma
└── types/index.ts
```

---

## Database Schema

Full Prisma schema as specified. Key models:

- **User** — linked to Clerk ID
- **Restaurant** — name, type, city, vibe; has platforms, reviews, voice samples, insights
- **VoiceSample** — 6 review types (positive_5star, service_complaint, food_complaint, wait_complaint, price_complaint, mixed); stores prompt + owner response
- **Platform** — one row per connected platform per restaurant; stores externalId, accessToken, isConnected, lastSyncedAt
- **Review** — platform, rating, text, isDelivery flag; unique on (platform, externalId)
- **ReviewResponse** — draftText, finalText, status (DRAFT → APPROVED → POSTED → DISMISSED)
- **Insight** — type (ALERT / TIP / DELIVERY_GAP), title, body, reviewCount, platforms[]
- **Subscription** — Stripe customer/subscription IDs, plan (FREE / STARTER / GROWTH / AGENCY), status

---

## Onboarding Flow (4 steps)

### Step 1 — Restaurant details (`/onboarding/restaurant`)
Fields: restaurant name, cuisine type (dropdown), city, vibe/personality (textarea).  
Placeholder: *"e.g. We're a neighbourhood spot — warm, casual, regulars know us by name"*

### Step 2 — Connect platforms (`/onboarding/connect`)
Six platform cards: Google, Yelp, TripAdvisor, DoorDash, Uber Eats, Grubhub.
- **Google**: mock OAuth button (real credentials added later)
- **Yelp**: input for business URL/ID
- **TripAdvisor**: input for listing URL
- **DoorDash / Uber Eats / Grubhub**: "Coming soon" grey badge — non-blocking
- Require at least Google to proceed. "Skip for now" link below grid.

### Step 3 — Voice training (`/onboarding/voice`)
Five scenarios presented one at a time:
1. Glowing 5-star review
2. Wait time / slow service complaint
3. Food quality complaint
4. Price/value complaint
5. Mixed review (good food, one issue)

For each: show sample review text, owner writes their response in a textarea. "Skip this one" available per scenario. Progress indicator: "3 of 5 scenarios complete". After all 5: *"Your voice is set — Stir will write like you from now on."* If all skipped: gentle persistent banner on dashboard — "Complete your voice setup".

### Step 4 — Plan picker (`/onboarding/plan`)
Three cards: Free (pre-selected), Starter, Growth. Clicking Starter/Growth triggers Stripe checkout (Phase 2 — show UI but link to coming-soon state for now). On completion → `/dashboard`.

---

## Dashboard

### Layout
- **Sidebar** (charcoal `#1A1A2E`): collapsible. Starts expanded showing nav labels. Small chevron button collapses to icon-only mode with hover tooltips. State persisted in `localStorage`.
- **Nav items**: Dashboard, Reviews, Insights, Settings
- **Main area**: warm-gray background (`#F9F6F2`)

### Main dashboard (`/dashboard`)
- Top bar: greeting + restaurant name, current date, "X new reviews" badge
- 3 score cards: Overall Score | Delivery Score | Awaiting Reply
- Two-column layout:
  - Left (wider): "Recent reviews" — latest 10, paginated, sorted by date
  - Right (narrower): "What to fix" — top 3 current insights
- **Voice setup banner**: persists until voice training complete, links to `/onboarding/voice`

### Reviews page (`/dashboard/reviews`)
Full list with filters: platform, rating (1–5), status (responded/not), date range. Sort by: newest, lowest rated, unanswered. Each row expands to full review + draft/response.

### Insights page (`/dashboard/insights`)
All insights grouped by type. Each shows title, explanation, review count, platforms. "Mark as read". "Regenerate insights" button (rate-limited 1×/24h via Redis).

---

## Review Card & Response Draft Component

Each `ReviewCard` shows: platform icon, star rating (colour-coded), date, author, truncated review text, and a "Draft response →" button.

`ResponseDraft` component:
- Shows AI-generated draft in an editable textarea
- Three actions: **Edit** (inline), **Approve & Post** (posts to platform), **Dismiss**
- Nothing is posted without owner tapping "Approve & Post" — non-negotiable
- **Phase 1 behaviour**: "Approve & Post" sets `ReviewResponse.status = POSTED` in the DB and shows a success state — no real API call is made. The real posting API is Phase 2. The UI flow is identical so no code changes needed when Phase 2 wires in the platform API.
- Free plan: after 3 drafts/month, shows upgrade prompt instead of draft (tracked in Redis)

---

## Scoring Logic (`lib/scoring.ts`)

**Overall score** — weighted average across dine-in platforms (delivery excluded):
- Google 40%, Yelp 25%, TripAdvisor 20%, Facebook 15%
- Only connected platforms included; weights redistributed proportionally if some missing
- Rounded to 1 decimal

**Delivery subscore** — average of `isDelivery: true` reviews only. Shown separately, never merged into overall score.

**Trend** — compare average rating last 30 days vs prior 30 days. Returns `{ direction: 'up' | 'down' | 'flat', delta: number }`.

---

## AI System (`lib/ai.ts`)

### Response drafting
1. Load owner's `VoiceSample[]` for the restaurant
2. Select most relevant samples by matching `reviewType` to the incoming review's sentiment/topic
3. Build system prompt with: restaurant name, vibe, 2–3 real owner samples as few-shot examples
4. Call `claude-haiku-4-5-20251001`, max 200 tokens
5. Store result in `ReviewResponse.draftText`

**System prompt rules enforced:**
- Match owner's exact tone, vocabulary, length
- 2–4 sentences max
- Never start with "Thank you for your feedback"
- Be specific to the review — reference actual details
- Negative: acknowledge specific issue, show care, invite back
- Positive: genuine gratitude with personal touch
- No unkept promises (e.g. "we've fixed it")
- Output response text only — no labels, quotes, or wrappers

### Insight generation (Phase 1 — on-demand only, no cron yet)
- Uses `claude-sonnet-4-6`
- Analyses last 60 days of reviews
- Returns structured JSON: `[{ type, title, body, reviewCount, platforms }]`
- Stored in `Insight` table

---

## Mock Data Strategy

Phase 1 uses realistic mock data so the full product is demonstrable without live API credentials.

- **Seed file** (`prisma/seed.ts`): creates a demo restaurant with 40–50 reviews across Google, Yelp, TripAdvisor; mix of ratings, review text, isDelivery flags; pre-written voice samples
- **Mock OAuth**: Google connect button completes a fake flow that stores a mock Platform record
- **Real API credentials**: added via `.env` later — no code changes required, just env vars

---

## Platform Integration Stubs (Phase 1)

| Platform | Phase 1 | Phase 2 |
|---|---|---|
| Google | Mock OAuth, mock reviews from seed | Real Business Profile API |
| Yelp | URL input stored, seed reviews | Yelp Fusion API |
| TripAdvisor | URL input stored, seed reviews | Content API |
| DoorDash | "Coming soon" badge | Manual import / scrape |
| Uber Eats | "Coming soon" badge | Manual import / scrape |
| Grubhub | "Coming soon" badge | Manual import / scrape |
| Facebook | Not shown in Phase 1 | Graph API |

---

## Landing Page

Built from scratch in React (`app/(marketing)/page.tsx`). No external HTML file.

Design quality guided by: **impeccable** + **ui-ux-pro-max** + **frontend-design** skills.

Sections (from spec):
1. Hero — headline, subheadline, CTA (Start free), social proof
2. Platform logos — "All your reviews, one place"
3. Score/dashboard preview
4. How it works (3 steps)
5. Pricing (Free / Starter / Growth / Agency)
6. Testimonials
7. CTA footer

Uses the Stir colour system exactly. Inter font. No deviations from the colour tokens.

---

## API Routes (Phase 1)

| Route | Method | Purpose |
|---|---|---|
| `/api/reviews/fetch` | POST | Trigger review sync (mock in Phase 1) |
| `/api/ai/draft` | POST | Generate draft for a review |
| `/api/ai/insights` | POST | Generate insights from last 60 days |

Rate limits via Upstash Redis:
- `/api/reviews/fetch`: max 1 sync per 10 minutes per restaurant
- `/api/ai/draft`: max 3 per calendar month on Free plan
- `/api/ai/insights`: max 1 per 24 hours per restaurant

---

## Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Database (Supabase)
DATABASE_URL=
DIRECT_URL=

# Anthropic
ANTHROPIC_API_KEY=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Google, Yelp, Stripe, Resend, and Cron vars are Phase 2.

---

## Phase 1 Build Order

1. Project setup — Next.js 14, TypeScript, Tailwind, Prisma, Supabase connection, `.env`
2. Auth — Clerk integration, sign-up/sign-in pages, middleware
3. Database — Prisma migrations + seed file with mock data
4. Onboarding flow — all 4 steps, data persisted to DB
5. Dashboard shell — collapsible sidebar, routing, empty states
6. Mock review sync — seed data surfaced through `/api/reviews/fetch`
7. AI draft system — `lib/ai.ts`, `/api/ai/draft`, `ResponseDraft` component
8. Score calculation — `lib/scoring.ts`, score cards on dashboard
9. Landing page — built from scratch, maximum design quality

---

## Key Product Rules (non-negotiable)

1. **Never post without owner approval.** "Approve & Post" is always an explicit tap.
2. **AI responses must use voice samples.** If no samples exist, prompt the owner to add them. Do not generate without samples.
3. **Free plan: 3 AI drafts/month hard limit.** Show upgrade prompt — do not silently fail.
4. **Delivery score always separate.** Never combined with overall score.
5. **Platform limitations clearly communicated.** UI notes where API posting isn't available.
6. **Voice setup banner persists** on dashboard until training is complete.

---

## Phase 2 (deferred — not in scope for this session)

- Stripe checkout, webhooks, plan enforcement middleware
- Review response posting back to Google via API
- Settings pages (voice editor, billing portal)
- Insight generation cron (daily, Vercel Cron)
- Weekly summary emails via Resend
- TripAdvisor + delivery platform aggregate ratings
- Competitor tracking (Growth plan feature)
