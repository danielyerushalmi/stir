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
