# Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional tabbed settings page at `/dashboard/settings` covering restaurant info, connected platforms, voice samples, and account management.

**Architecture:** Client component page fetches all data from a single `GET /api/settings` endpoint, then delegates each tab to a focused sub-component. Mutations hit dedicated REST routes and surface results via a shared toast. Account deletion removes both the DB record (cascade) and the Clerk user.

**Tech Stack:** Next.js 14 App Router, Prisma (PostgreSQL), Clerk v5, Tailwind CSS, Vitest + React Testing Library

---

## File Map

**Create:**
- `components/ui/Toast.tsx` — fixed bottom-right toast, auto-dismiss
- `components/ui/Modal.tsx` — centered overlay modal
- `app/api/settings/route.ts` — GET all settings data
- `app/api/settings/restaurant/route.ts` — PUT restaurant info
- `app/api/settings/platforms/connect/route.ts` — POST connect platform
- `app/api/settings/platforms/[name]/route.ts` — DELETE disconnect platform
- `app/api/settings/voice/route.ts` — POST add voice sample
- `app/api/settings/voice/[id]/route.ts` — PUT edit + DELETE voice sample
- `app/api/settings/account/route.ts` — DELETE account
- `app/dashboard/settings/_components/RestaurantTab.tsx`
- `app/dashboard/settings/_components/PlatformsTab.tsx`
- `app/dashboard/settings/_components/VoiceTab.tsx`
- `app/dashboard/settings/_components/AccountTab.tsx`
- `lib/__tests__/settings-components.test.tsx` — Toast + Modal unit tests

**Modify:**
- `prisma/schema.prisma` — remove `@@unique([restaurantId, reviewType])` from `VoiceSample`
- `app/dashboard/settings/page.tsx` — full implementation (replaces placeholder)

---

## Task 1: Remove VoiceSample unique constraint

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Remove the unique constraint**

In `prisma/schema.prisma`, find the `VoiceSample` model and remove the `@@unique` line:

```prisma
model VoiceSample {
  id            String     @id @default(cuid())
  restaurantId  String
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  reviewType    String
  sampleReview  String     @db.Text
  ownerResponse String     @db.Text
  createdAt     DateTime   @default(now())
}
```

- [ ] **Step 2: Generate and apply migration**

```bash
npx prisma migrate dev --name remove-voice-sample-unique
```

Expected output: `✔ Generated Prisma Client` and a new migration file in `prisma/migrations/`.

- [ ] **Step 3: Verify Prisma client regenerated**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: allow multiple voice samples per review type"
```

---

## Task 2: Toast component

**Files:**
- Create: `components/ui/Toast.tsx`
- Create: `lib/__tests__/settings-components.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/settings-components.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { Toast } from '@/components/ui/Toast'

describe('Toast', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('renders the message', () => {
    render(<Toast message="Changes saved" type="success" onDismiss={() => {}} />)
    expect(screen.getByText('Changes saved')).toBeTruthy()
  })

  it('calls onDismiss after 3 seconds', () => {
    const onDismiss = vi.fn()
    render(<Toast message="ok" type="success" onDismiss={onDismiss} />)
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(3000) })
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('renders success dot for success type', () => {
    const { container } = render(<Toast message="ok" type="success" onDismiss={() => {}} />)
    const dot = container.querySelector('.bg-green')
    expect(dot).toBeTruthy()
  })

  it('renders error dot for error type', () => {
    const { container } = render(<Toast message="fail" type="error" onDismiss={() => {}} />)
    const dot = container.querySelector('.bg-red-dark')
    expect(dot).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run lib/__tests__/settings-components.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/ui/Toast'`

- [ ] **Step 3: Implement Toast**

Create `components/ui/Toast.tsx`:

```tsx
'use client'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg bg-charcoal px-4 py-2.5 text-sm text-white shadow-lg animate-in fade-in slide-in-from-bottom-2">
      <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', type === 'success' ? 'bg-green' : 'bg-red-dark')} />
      {message}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/__tests__/settings-components.test.tsx
```

Expected: PASS — 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add components/ui/Toast.tsx lib/__tests__/settings-components.test.tsx
git commit -m "feat: add Toast UI component"
```

---

## Task 3: Modal component

**Files:**
- Create: `components/ui/Modal.tsx`
- Modify: `lib/__tests__/settings-components.test.tsx`

- [ ] **Step 1: Add Modal tests** (append to `lib/__tests__/settings-components.test.tsx`)

```tsx
import { Modal } from '@/components/ui/Modal'
import { fireEvent } from '@testing-library/react'

describe('Modal', () => {
  it('renders title and children', () => {
    render(
      <Modal title="Confirm delete" onClose={() => {}} footer={<button>OK</button>}>
        <p>Are you sure?</p>
      </Modal>
    )
    expect(screen.getByText('Confirm delete')).toBeTruthy()
    expect(screen.getByText('Are you sure?')).toBeTruthy()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal title="Test" onClose={onClose} footer={null}>
        <p>body</p>
      </Modal>
    )
    const backdrop = container.querySelector('.bg-black\\/30') as HTMLElement
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders footer content', () => {
    render(
      <Modal title="Test" onClose={() => {}} footer={<button>Confirm</button>}>
        <p>body</p>
      </Modal>
    )
    expect(screen.getByText('Confirm')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify Modal tests fail**

```bash
npx vitest run lib/__tests__/settings-components.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/ui/Modal'`

- [ ] **Step 3: Implement Modal**

Create `components/ui/Modal.tsx`:

```tsx
'use client'
import { ReactNode } from 'react'

interface ModalProps {
  title: string
  children: ReactNode
  footer: ReactNode
  onClose: () => void
}

export function Modal({ title, children, footer, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-charcoal">{title}</h2>
        <div className="mb-6">{children}</div>
        <div className="flex justify-end gap-3">{footer}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run lib/__tests__/settings-components.test.tsx
```

Expected: PASS — all 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add components/ui/Modal.tsx lib/__tests__/settings-components.test.tsx
git commit -m "feat: add Modal UI component"
```

---

## Task 4: GET /api/settings

**Files:**
- Create: `app/api/settings/route.ts`

- [ ] **Step 1: Create the route**

Create `app/api/settings/route.ts`:

```ts
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({
    where: { userId: user.id },
    include: { platforms: true, voiceSamples: { orderBy: { createdAt: 'asc' } }, subscription: true },
  })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  return NextResponse.json({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      cuisineType: restaurant.cuisineType,
      city: restaurant.city,
      vibe: restaurant.vibe,
    },
    platforms: restaurant.platforms.map(p => ({
      name: p.name,
      isConnected: p.isConnected,
      lastSyncedAt: p.lastSyncedAt,
    })),
    voiceSamples: restaurant.voiceSamples.map(v => ({
      id: v.id,
      reviewType: v.reviewType,
      sampleReview: v.sampleReview,
      ownerResponse: v.ownerResponse,
    })),
    subscription: restaurant.subscription ? { plan: restaurant.subscription.plan } : null,
  })
}
```

- [ ] **Step 2: Start dev server and test the endpoint manually**

```bash
npm run dev
```

In another terminal:
```bash
curl http://localhost:3000/api/settings
```

Expected: `{"error":"Unauthorized"}` (not logged in — correct behaviour).

- [ ] **Step 3: Commit**

```bash
git add app/api/settings/route.ts
git commit -m "feat: add GET /api/settings endpoint"
```

---

## Task 5: PUT /api/settings/restaurant

**Files:**
- Create: `app/api/settings/restaurant/route.ts`

- [ ] **Step 1: Create the route**

Create `app/api/settings/restaurant/route.ts`:

```ts
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function PUT(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { name, cuisineType, city, vibe } = await req.json()
  if (!name || !cuisineType || !city || !vibe)
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  await db.restaurant.update({
    where: { id: restaurant.id },
    data: { name, cuisineType, city, vibe },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/settings/restaurant/route.ts
git commit -m "feat: add PUT /api/settings/restaurant"
```

---

## Task 6: Platform connect / disconnect routes

**Files:**
- Create: `app/api/settings/platforms/connect/route.ts`
- Create: `app/api/settings/platforms/[name]/route.ts`

- [ ] **Step 1: Create the connect route**

Create `app/api/settings/platforms/connect/route.ts`:

```ts
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { platform } = await req.json()
  if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  await db.platform.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: platform } },
    update: { isConnected: true },
    create: {
      restaurantId: restaurant.id,
      name: platform,
      isConnected: true,
      externalId: `mock_${platform.toLowerCase()}`,
    },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create the disconnect route**

Create `app/api/settings/platforms/[name]/route.ts`:

```ts
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function DELETE(
  _req: Request,
  { params }: { params: { name: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  await db.platform.updateMany({
    where: { restaurantId: restaurant.id, name: params.name },
    data: { isConnected: false },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/settings/platforms/
git commit -m "feat: add platform connect/disconnect routes"
```

---

## Task 7: Voice sample CRUD routes

**Files:**
- Create: `app/api/settings/voice/route.ts`
- Create: `app/api/settings/voice/[id]/route.ts`

- [ ] **Step 1: Create POST /api/settings/voice**

Create `app/api/settings/voice/route.ts`:

```ts
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { reviewType, sampleReview, ownerResponse } = await req.json()
  if (!reviewType || !sampleReview || !ownerResponse)
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const sample = await db.voiceSample.create({
    data: { restaurantId: restaurant.id, reviewType, sampleReview, ownerResponse },
  })

  return NextResponse.json({ sample: { id: sample.id, reviewType: sample.reviewType, sampleReview: sample.sampleReview, ownerResponse: sample.ownerResponse } })
}
```

- [ ] **Step 2: Create PUT and DELETE /api/settings/voice/[id]**

Create `app/api/settings/voice/[id]/route.ts`:

```ts
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { reviewType, sampleReview, ownerResponse } = await req.json()
  if (!reviewType || !sampleReview || !ownerResponse)
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const existing = await db.voiceSample.findFirst({
    where: { id: params.id, restaurantId: restaurant.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const sample = await db.voiceSample.update({
    where: { id: params.id },
    data: { reviewType, sampleReview, ownerResponse },
  })

  return NextResponse.json({ sample: { id: sample.id, reviewType: sample.reviewType, sampleReview: sample.sampleReview, ownerResponse: sample.ownerResponse } })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const restaurant = await db.restaurant.findFirst({ where: { userId: user.id } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const existing = await db.voiceSample.findFirst({
    where: { id: params.id, restaurantId: restaurant.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.voiceSample.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/settings/voice/
git commit -m "feat: add voice sample CRUD routes"
```

---

## Task 8: DELETE /api/settings/account

**Files:**
- Create: `app/api/settings/account/route.ts`

- [ ] **Step 1: Create the route**

Create `app/api/settings/account/route.ts`:

```ts
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateDbUser } from '@/lib/user'

export async function DELETE() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getOrCreateDbUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await db.user.delete({ where: { id: user.id } })
  await clerkClient.users.deleteUser(userId)

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/settings/account/route.ts
git commit -m "feat: add DELETE /api/settings/account"
```

---

## Task 9: RestaurantTab component

**Files:**
- Create: `app/dashboard/settings/_components/RestaurantTab.tsx`

- [ ] **Step 1: Create RestaurantTab**

Create `app/dashboard/settings/_components/RestaurantTab.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface RestaurantData {
  name: string
  cuisineType: string
  city: string
  vibe: string
}

interface RestaurantTabProps {
  restaurant: RestaurantData
  onToast: (message: string, type: 'success' | 'error') => void
}

export function RestaurantTab({ restaurant, onToast }: RestaurantTabProps) {
  const [form, setForm] = useState(restaurant)
  const [saving, setSaving] = useState(false)

  function set(field: keyof RestaurantData, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/restaurant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      onToast('Restaurant updated', 'success')
    } catch {
      onToast('Failed to save changes', 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-border bg-cream px-4 py-2.5 text-sm text-charcoal placeholder:text-text-lighter focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20'
  const labelClass = 'block text-xs font-medium uppercase tracking-wide text-text-lighter mb-1.5'

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-charcoal">Restaurant info</h2>
      <p className="mb-5 text-xs text-text-lighter">This information helps Stir personalise your AI responses.</p>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Restaurant name</label>
          <input className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Cuisine type</label>
          <input className={inputClass} value={form.cuisineType} onChange={e => set('cuisineType', e.target.value)} />
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass}>City</label>
        <input className={inputClass} value={form.city} onChange={e => set('city', e.target.value)} />
      </div>

      <div className="mb-5">
        <label className={labelClass}>Vibe &amp; description</label>
        <textarea
          className={`${inputClass} min-h-[88px] resize-y`}
          value={form.vibe}
          onChange={e => set('vibe', e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/settings/_components/RestaurantTab.tsx
git commit -m "feat: add RestaurantTab settings component"
```

---

## Task 10: PlatformsTab component

**Files:**
- Create: `app/dashboard/settings/_components/PlatformsTab.tsx`

- [ ] **Step 1: Create PlatformsTab**

Create `app/dashboard/settings/_components/PlatformsTab.tsx`:

```tsx
'use client'
import { useState } from 'react'
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

function formatSync(ts: string | null): string {
  if (!ts) return 'Never synced'
  const diff = Date.now() - new Date(ts).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Synced recently'
  if (h < 24) return `Synced ${h}h ago`
  const d = Math.floor(h / 24)
  return `Synced ${d}d ago`
}

export function PlatformsTab({ platforms: initial, onToast }: PlatformsTabProps) {
  const [platforms, setPlatforms] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)

  function getState(name: string): PlatformData {
    return platforms.find(p => p.name === name) ?? { name, isConnected: false, lastSyncedAt: null }
  }

  async function toggle(name: string, isConnected: boolean) {
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
                  p.isConnected ? 'bg-green-light text-green' : 'bg-border text-text-lighter'
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

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/settings/_components/PlatformsTab.tsx
git commit -m "feat: add PlatformsTab settings component"
```

---

## Task 11: VoiceTab component

**Files:**
- Create: `app/dashboard/settings/_components/VoiceTab.tsx`

- [ ] **Step 1: Create VoiceTab**

Create `app/dashboard/settings/_components/VoiceTab.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface VoiceSample {
  id: string
  reviewType: string
  sampleReview: string
  ownerResponse: string
}

interface VoiceTabProps {
  voiceSamples: VoiceSample[]
  onToast: (message: string, type: 'success' | 'error') => void
}

const TYPE_OPTIONS = ['positive', 'negative', 'neutral']
const TYPE_VARIANT: Record<string, 'green' | 'red' | 'amber'> = {
  positive: 'green',
  negative: 'red',
  neutral: 'amber',
}

const EMPTY_FORM = { reviewType: 'positive', sampleReview: '', ownerResponse: '' }

const textareaClass = 'w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm text-charcoal placeholder:text-text-lighter focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 resize-y min-h-[72px]'
const labelClass = 'block text-xs font-medium uppercase tracking-wide text-text-lighter mb-1'

export function VoiceTab({ voiceSamples: initial, onToast }: VoiceTabProps) {
  const [samples, setSamples] = useState(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  function startEdit(s: VoiceSample) {
    setEditingId(s.id)
    setEditForm({ reviewType: s.reviewType, sampleReview: s.sampleReview, ownerResponse: s.ownerResponse })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/settings/voice/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error()
      const { sample } = await res.json()
      setSamples(prev => prev.map(s => s.id === id ? sample : s))
      setEditingId(null)
      onToast('Sample updated', 'success')
    } catch {
      onToast('Failed to save sample', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSample(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/settings/voice/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setSamples(prev => prev.filter(s => s.id !== id))
      setDeletingId(null)
      onToast('Sample deleted', 'success')
    } catch {
      onToast('Failed to delete sample', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function addSample() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      if (!res.ok) throw new Error()
      const { sample } = await res.json()
      setSamples(prev => [...prev, sample])
      setAddForm(EMPTY_FORM)
      setShowAddForm(false)
      onToast('Sample added', 'success')
    } catch {
      onToast('Failed to add sample', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-charcoal">Voice samples</h2>
      <p className="mb-5 text-xs text-text-lighter">
        Stir uses these to match your writing style when generating drafts. More examples = better results.
      </p>

      <div className="flex flex-col gap-3 mb-4">
        {samples.length === 0 && !showAddForm && (
          <p className="text-sm text-text-lighter py-2">No samples yet. Add one below to unlock AI draft generation.</p>
        )}

        {samples.map(s => (
          <div key={s.id} className="rounded-xl border border-border bg-cream p-4">
            {editingId === s.id ? (
              /* Edit mode */
              <div>
                <div className="mb-3">
                  <label className={labelClass}>Review type</label>
                  <select
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-charcoal focus:border-orange focus:outline-none"
                    value={editForm.reviewType}
                    onChange={e => setEditForm(f => ({ ...f, reviewType: e.target.value }))}
                  >
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className={labelClass}>Customer review</label>
                  <textarea className={textareaClass} value={editForm.sampleReview} onChange={e => setEditForm(f => ({ ...f, sampleReview: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className={labelClass}>Your response</label>
                  <textarea className={textareaClass} value={editForm.ownerResponse} onChange={e => setEditForm(f => ({ ...f, ownerResponse: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                  <Button size="sm" disabled={saving} onClick={() => saveEdit(s.id)}>{saving ? 'Saving…' : 'Save'}</Button>
                </div>
              </div>
            ) : deletingId === s.id ? (
              /* Inline delete confirmation */
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-charcoal">Delete this sample? This cannot be undone.</p>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
                  <Button
                    size="sm"
                    className="bg-red-dark hover:bg-red-dark/90 text-white"
                    disabled={saving}
                    onClick={() => deleteSample(s.id)}
                  >
                    {saving ? '…' : 'Delete'}
                  </Button>
                </div>
              </div>
            ) : (
              /* Read mode */
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant={TYPE_VARIANT[s.reviewType] ?? 'gray'}>
                    {s.reviewType.charAt(0).toUpperCase() + s.reviewType.slice(1)}
                  </Badge>
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-lighter mb-0.5">Customer review</p>
                <p className="text-sm text-charcoal mb-3 leading-relaxed">&ldquo;{s.sampleReview}&rdquo;</p>
                <p className="text-xs font-medium uppercase tracking-wide text-text-lighter mb-0.5">Your response</p>
                <p className="text-sm text-charcoal leading-relaxed">{s.ownerResponse}</p>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => startEdit(s)}>Edit</Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-red-dark hover:text-red-dark"
                    onClick={() => setDeletingId(s.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {showAddForm && (
          <div className="rounded-xl border border-dashed border-orange bg-orange-light/30 p-4">
            <p className="text-xs font-semibold text-orange mb-3">New sample</p>
            <div className="mb-3">
              <label className={labelClass}>Review type</label>
              <select
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-charcoal focus:border-orange focus:outline-none"
                value={addForm.reviewType}
                onChange={e => setAddForm(f => ({ ...f, reviewType: e.target.value }))}
              >
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className={labelClass}>Customer review</label>
              <textarea
                className={textareaClass}
                placeholder="Paste a real review you received…"
                value={addForm.sampleReview}
                onChange={e => setAddForm(f => ({ ...f, sampleReview: e.target.value }))}
              />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Your response</label>
              <textarea
                className={textareaClass}
                placeholder="How you actually responded to it…"
                value={addForm.ownerResponse}
                onChange={e => setAddForm(f => ({ ...f, ownerResponse: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM) }}>Cancel</Button>
              <Button
                size="sm"
                disabled={saving || !addForm.sampleReview || !addForm.ownerResponse}
                onClick={addSample}
              >
                {saving ? 'Saving…' : 'Save sample'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {!showAddForm && (
        <Button variant="secondary" className="w-full" onClick={() => setShowAddForm(true)}>
          + Add a sample
        </Button>
      )}
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/settings/_components/VoiceTab.tsx
git commit -m "feat: add VoiceTab settings component"
```

---

## Task 12: AccountTab component

**Files:**
- Create: `app/dashboard/settings/_components/AccountTab.tsx`

- [ ] **Step 1: Create AccountTab**

Create `app/dashboard/settings/_components/AccountTab.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'

interface AccountTabProps {
  email: string
  plan: string
  memberSince: string
  onToast: (message: string, type: 'success' | 'error') => void
}

export function AccountTab({ email, plan, memberSince, onToast }: AccountTabProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function deleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch('/api/settings/account', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.push('/')
    } catch {
      onToast('Failed to delete account', 'error')
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const rowClass = 'flex items-center py-3 border-b border-border last:border-0'
  const labelClass = 'w-32 flex-shrink-0 text-xs font-medium uppercase tracking-wide text-text-lighter'

  return (
    <>
      <Card className="mb-4">
        <h2 className="mb-1 text-sm font-semibold text-charcoal">Account</h2>
        <p className="mb-5 text-xs text-text-lighter">Your profile and current plan.</p>

        <div className={rowClass}>
          <span className={labelClass}>Email</span>
          <span className="text-sm text-charcoal">{email}</span>
        </div>
        <div className={rowClass}>
          <span className={labelClass}>Plan</span>
          <Badge variant={plan === 'FREE' ? 'gray' : 'orange'}>
            {plan === 'FREE' ? 'Free plan' : plan.charAt(0) + plan.slice(1).toLowerCase() + ' plan'}
          </Badge>
        </div>
        <div className={rowClass}>
          <span className={labelClass}>Member since</span>
          <span className="text-sm text-charcoal">{memberSince}</span>
        </div>

        <div className="flex justify-end mt-4">
          <SignOutButton>
            <Button variant="secondary">Sign out</Button>
          </SignOutButton>
        </div>
      </Card>

      <div className="rounded-xl border border-red-light bg-white p-6">
        <h3 className="mb-1 text-sm font-semibold text-red-dark">Danger zone</h3>
        <p className="mb-5 text-xs text-text-lighter">These actions are permanent and cannot be undone.</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-charcoal">Delete account</p>
            <p className="text-xs text-text-lighter mt-0.5">Permanently deletes your restaurant, reviews, and all data.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="text-red-dark hover:bg-red-light border-red-light"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete account
          </Button>
        </div>
      </div>

      {showDeleteModal && (
        <Modal
          title="Delete your account"
          onClose={() => { setShowDeleteModal(false); setConfirmText('') }}
          footer={
            <>
              <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setConfirmText('') }}>
                Cancel
              </Button>
              <Button
                className="bg-red-dark hover:bg-red-dark/90 text-white"
                disabled={confirmText !== 'DELETE' || deleting}
                onClick={deleteAccount}
              >
                {deleting ? 'Deleting…' : 'Delete account'}
              </Button>
            </>
          }
        >
          <p className="text-sm text-charcoal mb-4">
            This will permanently delete your restaurant, all reviews, voice samples, and your account.
            <strong className="block mt-2">Type DELETE to confirm.</strong>
          </p>
          <input
            className="w-full rounded-lg border border-border bg-cream px-4 py-2.5 text-sm text-charcoal focus:border-red-dark focus:outline-none focus:ring-2 focus:ring-red-dark/20"
            placeholder="DELETE"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
          />
        </Modal>
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/settings/_components/AccountTab.tsx
git commit -m "feat: add AccountTab settings component"
```

---

## Task 13: Wire up the settings page

**Files:**
- Modify: `app/dashboard/settings/page.tsx`

- [ ] **Step 1: Replace the placeholder with the full settings page**

Replace the entire contents of `app/dashboard/settings/page.tsx` with:

```tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { Toast } from '@/components/ui/Toast'
import { RestaurantTab } from './_components/RestaurantTab'
import { PlatformsTab } from './_components/PlatformsTab'
import { VoiceTab } from './_components/VoiceTab'
import { AccountTab } from './_components/AccountTab'
import { cn } from '@/lib/utils'

type Tab = 'restaurant' | 'platforms' | 'voice' | 'account'

interface SettingsData {
  restaurant: { id: string; name: string; cuisineType: string; city: string; vibe: string }
  platforms: { name: string; isConnected: boolean; lastSyncedAt: string | null }[]
  voiceSamples: { id: string; reviewType: string; sampleReview: string; ownerResponse: string }[]
  subscription: { plan: string } | null
}

interface ToastState {
  message: string
  type: 'success' | 'error'
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'platforms',  label: 'Platforms' },
  { id: 'voice',      label: 'Voice & Tone' },
  { id: 'account',    label: 'Account' },
]

export default function SettingsPage() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<Tab>('restaurant')
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-charcoal mb-6">Settings</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-orange bg-orange-light text-orange'
                : 'border-border bg-white text-text-lighter hover:border-orange hover:text-orange'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-text-lighter">Loading…</p>
      ) : !data ? (
        <p className="text-sm text-red-dark">Failed to load settings. Please refresh.</p>
      ) : (
        <>
          {activeTab === 'restaurant' && (
            <RestaurantTab restaurant={data.restaurant} onToast={showToast} />
          )}
          {activeTab === 'platforms' && (
            <PlatformsTab platforms={data.platforms} onToast={showToast} />
          )}
          {activeTab === 'voice' && (
            <VoiceTab voiceSamples={data.voiceSamples} onToast={showToast} />
          )}
          {activeTab === 'account' && (
            <AccountTab
              email={user?.primaryEmailAddress?.emailAddress ?? '—'}
              plan={data.subscription?.plan ?? 'FREE'}
              memberSince={memberSince}
              onToast={showToast}
            />
          )}
        </>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 3: Start dev server and manually test each tab**

```bash
npm run dev
```

Go to `http://localhost:3000/dashboard/settings` and verify:
- Restaurant tab: fields pre-fill, save triggers toast
- Platforms tab: connect/disconnect buttons toggle badge and fire toast
- Voice & Tone tab: add, edit (inline), delete (inline confirm) all work
- Account tab: plan badge shows, Sign out button visible, Delete account requires typing DELETE

- [ ] **Step 4: Final commit**

```bash
git add app/dashboard/settings/
git commit -m "feat: implement settings page with restaurant, platforms, voice, and account tabs"
```
