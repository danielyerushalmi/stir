# Stir Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Stir's visual identity with a new logo, warm colour system, animated landing page with sticky sections and interactive demo widget, and a polished dashboard.

**Architecture:** Framer Motion handles all animations (scroll reveals, sticky transitions, interactive demo). Color tokens are updated in Tailwind config first so every downstream component picks them up automatically. Landing page is decomposed into focused section components. Dashboard components get surgical refreshes.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, inline SVG (logo).

---

## File Map

```
components/
  logo/StirLogo.tsx                      ← new SVG logo component
  ui/MotionCard.tsx                      ← reusable scroll-fade-up wrapper
  landing/
    HeroSection.tsx                      ← new
    ProblemSection.tsx                   ← new (sticky)
    PlatformStrip.tsx                    ← new
    HowItWorksSection.tsx                ← new (sticky)
    DemoWidget.tsx                       ← new (interactive)
    PricingSection.tsx                   ← new
    TestimonialsSection.tsx              ← new
    CtaSection.tsx                       ← new
  dashboard/
    Sidebar.tsx                          ← modify (colours + logo)
    ScoreCard.tsx                        ← modify (shadow, border strip, count-up)
    ReviewCard.tsx                       ← modify (platform pills, hover)
    ResponseDraft.tsx                    ← modify (typing indicator, success anim)
app/
  (marketing)/page.tsx                   ← replace with section imports
  dashboard/layout.tsx                   ← add page transition wrapper
tailwind.config.ts                       ← add brown/cream tokens
app/globals.css                          ← grain texture CSS
```

---

## Task 1: Install Framer Motion + Update Colour Tokens

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Install Framer Motion**

```bash
npm install framer-motion
```
Expected: installs without errors.

- [ ] **Step 2: Update tailwind.config.ts**

Replace the full `theme.extend.colors` block in `tailwind.config.ts`:
```typescript
colors: {
  orange: { DEFAULT: '#E8630A', dark: '#C4520A', light: '#FEF0E7' },
  brown: { DEFAULT: '#2C1810', mid: '#5C3D2E' },
  cream: { DEFAULT: '#FAF7F2', dark: '#F2EDE4' },
  border: '#E8DDD2',
  'text-muted': '#5C3D2E',
  'text-lighter': '#9C8778',
  green: { DEFAULT: '#2D9B6F', light: '#EAF3DE' },
  'amber-light': '#FAEEDA',
  'amber-dark': '#633806',
  'red-light': '#FCEBEB',
  'red-dark': '#A32D2D',
  // keep charcoal as alias during migration
  charcoal: '#2C1810',
  'warm-gray': '#FAF7F2',
},
```

- [ ] **Step 3: Update globals.css**

Replace `app/globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --orange: #E8630A;
  --brown: #2C1810;
  --cream: #FAF7F2;
}

body {
  background-color: #FAF7F2;
  font-family: 'Inter', sans-serif;
}

.grain {
  position: relative;
}
.grain::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}
```

- [ ] **Step 4: Verify build still passes**

```bash
npm run build
```
Expected: clean build, no type errors.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts app/globals.css package.json package-lock.json
git commit -m "feat: add framer-motion, update colour tokens to warm brown/cream palette"
```

---

## Task 2: StirLogo SVG Component

**Files:**
- Create: `components/logo/StirLogo.tsx`

- [ ] **Step 1: Create the logo component**

Create `components/logo/StirLogo.tsx`:
```typescript
interface StirLogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'icon' | 'white'
  className?: string
}

const sizes = {
  sm: { icon: 24, text: 18 },
  md: { icon: 32, text: 22 },
  lg: { icon: 40, text: 28 },
}

export function StirLogo({ size = 'md', variant = 'full', className = '' }: StirLogoProps) {
  const { icon, text } = sizes[size]
  const color = variant === 'white' ? '#FFFFFF' : '#2C1810'
  const orangeColor = variant === 'white' ? '#FAF7F2' : '#E8630A'

  const SpoonIcon = (
    <svg
      width={icon}
      height={icon}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: 'rotate(-15deg)' }}
    >
      {/* Spoon bowl */}
      <ellipse cx="16" cy="9" rx="6" ry="7.5" fill={orangeColor} />
      {/* Smile curve inside bowl */}
      <path
        d="M12.5 10 Q16 13.5 19.5 10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Handle */}
      <path
        d="M16 16.5 Q15 22 14.5 28"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )

  if (variant === 'icon') return <div className={className}>{SpoonIcon}</div>

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {SpoonIcon}
      <span
        style={{
          fontSize: text,
          fontWeight: 600,
          color,
          letterSpacing: '-0.02em',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        stir
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Update Sidebar to use logo**

In `components/dashboard/Sidebar.tsx`, replace the text "stir" with the logo:

Find:
```typescript
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
```
Replace with:
```typescript
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { StirLogo } from '@/components/logo/StirLogo'
```

Find:
```typescript
        {!collapsed && <span className="font-semibold text-lg tracking-tight">stir</span>}
```
Replace with:
```typescript
        {!collapsed && <StirLogo variant="white" size="sm" />}
```

- [ ] **Step 3: Update auth pages to use logo**

In `app/(auth)/sign-in/[[...sign-in]]/page.tsx`, add the logo above the SignIn component:
```typescript
import { SignIn } from '@clerk/nextjs'
import { StirLogo } from '@/components/logo/StirLogo'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-6">
      <StirLogo size="lg" />
      <SignIn fallbackRedirectUrl="/dashboard" />
    </div>
  )
}
```

In `app/(auth)/sign-up/[[...sign-up]]/page.tsx`:
```typescript
import { SignUp } from '@clerk/nextjs'
import { StirLogo } from '@/components/logo/StirLogo'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-6">
      <StirLogo size="lg" />
      <SignUp fallbackRedirectUrl="/onboarding" />
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add components/logo/StirLogo.tsx components/dashboard/Sidebar.tsx "app/(auth)/sign-in/[[...sign-in]]/page.tsx" "app/(auth)/sign-up/[[...sign-up]]/page.tsx"
git commit -m "feat: StirLogo SVG component, update sidebar and auth pages"
```

---

## Task 3: MotionCard + Sidebar Colour Refresh

**Files:**
- Create: `components/ui/MotionCard.tsx`
- Modify: `components/dashboard/Sidebar.tsx`

- [ ] **Step 1: Create MotionCard wrapper**

Create `components/ui/MotionCard.tsx`:
```typescript
'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { ReactNode } from 'react'

interface MotionCardProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function MotionCard({ children, className = '', delay = 0 }: MotionCardProps) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Update Sidebar colours**

In `components/dashboard/Sidebar.tsx`, replace `bg-charcoal` with `bg-brown` and update hover/active states:

Find:
```typescript
    <aside className={cn('flex flex-col bg-charcoal text-white transition-all duration-200 min-h-screen', collapsed ? 'w-16' : 'w-56')}>
```
Replace with:
```typescript
    <aside className={cn('flex flex-col bg-brown text-white transition-all duration-200 min-h-screen', collapsed ? 'w-16' : 'w-56')}>
```

Find:
```typescript
            className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors', active ? 'bg-orange text-white' : 'text-white/70 hover:bg-white/10 hover:text-white')}
```
Replace with:
```typescript
            className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors', active ? 'bg-orange text-white shadow-sm' : 'text-white/70 hover:bg-brown-mid/50 hover:text-white')}
```

Find:
```typescript
        <button onClick={toggleCollapsed} className="ml-auto rounded p-1 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
```
Replace with:
```typescript
        <button onClick={toggleCollapsed} className="ml-auto rounded p-1 hover:bg-brown-mid/50 text-white/60 hover:text-white transition-colors" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/MotionCard.tsx components/dashboard/Sidebar.tsx
git commit -m "feat: MotionCard scroll-reveal wrapper, sidebar warm colour refresh"
```

---

## Task 4: Dashboard Component Refresh (ScoreCard, ReviewCard, ResponseDraft)

**Files:**
- Modify: `components/dashboard/ScoreCard.tsx`
- Modify: `components/dashboard/ReviewCard.tsx`
- Modify: `components/dashboard/ResponseDraft.tsx`
- Modify: `app/dashboard/layout.tsx`

- [ ] **Step 1: Refresh ScoreCard**

Replace `components/dashboard/ScoreCard.tsx`:
```typescript
'use client'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ScoreCardProps {
  label: string
  score: number | null
  trend?: { direction: 'up' | 'down' | 'flat'; delta: number }
  subtitle?: string
  integer?: boolean
}

function useCountUp(target: number | null, duration = 1200) {
  const [value, setValue] = useState(0)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (target === null) return
    if (prefersReduced) { setValue(target); return }
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target * 10) / 10)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration, prefersReduced])

  return value
}

export function ScoreCard({ label, score, trend, subtitle, integer = false }: ScoreCardProps) {
  const animated = useCountUp(score)
  const displayValue = score !== null
    ? (integer ? String(Math.round(animated)) : animated.toFixed(1))
    : '—'

  const borderColor = score === null ? 'border-border'
    : score >= 4.0 ? 'border-green'
    : score >= 3.0 ? 'border-amber-dark'
    : 'border-red-dark'

  const textColor = score === null ? 'text-brown'
    : score >= 4.0 ? 'text-green'
    : score >= 3.0 ? 'text-amber-dark'
    : 'text-red-dark'

  return (
    <div className={cn('rounded-xl border-l-4 border border-border bg-white p-6 shadow-md', borderColor)}>
      <p className="text-xs font-medium text-text-lighter uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <p className={cn('text-3xl font-semibold', textColor)}>{displayValue}</p>
        {trend && trend.direction !== 'flat' && (
          <span className={cn('text-sm font-medium mb-1', trend.direction === 'up' ? 'text-green' : 'text-red-dark')}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.delta}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-text-lighter mt-1">{subtitle}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Refresh ReviewCard**

Replace `components/dashboard/ReviewCard.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const PLATFORM_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  GOOGLE: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Google' },
  YELP: { bg: 'bg-red-50', text: 'text-red-600', label: 'Yelp' },
  TRIPADVISOR: { bg: 'bg-green-light', text: 'text-green', label: 'TripAdvisor' },
  DOORDASH: { bg: 'bg-red-50', text: 'text-red-600', label: 'DoorDash' },
  UBEREATS: { bg: 'bg-green-light', text: 'text-green', label: 'Uber Eats' },
  GRUBHUB: { bg: 'bg-orange-light', text: 'text-orange', label: 'Grubhub' },
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'text-orange' : 'text-border'}>★</span>
      ))}
    </span>
  )
}

interface ReviewCardProps {
  review: {
    id: string
    platform: string
    rating: number
    reviewText: string
    authorName: string
    reviewDate: string | Date
    isDelivery: boolean
    response?: { id: string; draftText: string; status: string } | null
  }
  onDraftRequest: (reviewId: string) => void
}

export function ReviewCard({ review, onDraftRequest }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false)
  const platform = PLATFORM_STYLES[review.platform] ?? { bg: 'bg-border', text: 'text-text-muted', label: review.platform }

  return (
    <motion.div
      className="border border-border rounded-xl bg-white p-4 shadow-sm"
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', platform.bg, platform.text)}>
              {platform.label}
            </span>
            {review.isDelivery && <Badge variant="gray">Delivery</Badge>}
            <StarRating rating={review.rating} />
          </div>
          <p className="text-sm font-medium text-brown">{review.authorName}</p>
          <p className="text-xs text-text-lighter mt-0.5">
            {new Date(review.reviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p className={cn('mt-2 text-sm text-text-muted', !expanded && 'line-clamp-2')}>{review.reviewText}</p>
          {review.reviewText.length > 120 && (
            <button className="text-xs text-orange mt-1 hover:text-orange-dark" onClick={() => setExpanded(e => !e)}>
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
        <div className="shrink-0">
          {review.response ? (
            <Badge variant={review.response.status === 'POSTED' ? 'green' : 'orange'}>
              {review.response.status === 'POSTED' ? 'Replied' : 'Draft ready'}
            </Badge>
          ) : (
            <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.15 }}>
              <Button size="sm" onClick={() => onDraftRequest(review.id)}>
                Draft reply →
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: Refresh ResponseDraft**

Replace `components/dashboard/ResponseDraft.tsx`:
```typescript
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'

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
        <p className="text-sm text-green font-medium">Response approved and marked as posted.</p>
      </motion.div>
    )
  }

  return (
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
                onClick={async () => {
                  setLoading('approve')
                  await onApprove(reviewId, text)
                  setPosted(true)
                  setLoading(null)
                }}
              >
                {loading === 'approve' ? 'Posting...' : 'Approve & Post'}
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
  )
}
```

- [ ] **Step 4: Add page transition to dashboard layout**

Replace `app/dashboard/layout.tsx`:
```typescript
'use client'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { usePathname } from 'next/navigation'

// Note: layout must remain a Server Component for auth() to work.
// Page transitions are handled via a separate client wrapper.

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-cream overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
```

Note: Page transitions require a client component. Since dashboard/layout.tsx must be a server component for auth(), add a lightweight client wrapper inside the main area instead. Create `components/dashboard/PageTransition.tsx`:

```typescript
'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  )
}
```

Then wrap `{children}` in the layout with `<PageTransition>`:
```typescript
      <main className="flex-1 bg-cream overflow-y-auto">
        <PageTransition>{children}</PageTransition>
      </main>
```

- [ ] **Step 5: Update dashboard page backgrounds**

In `app/dashboard/page.tsx`, change the outer div background if needed. The `bg-cream` is now set in layout, so individual page padding is fine as-is.

- [ ] **Step 6: Verify build and run dev**

```bash
npm run build
```

```bash
npm run dev
```
Navigate to http://localhost:3000/dashboard — verify sidebar is warm brown, score cards have coloured left borders, review cards have platform pills.

- [ ] **Step 7: Commit**

```bash
git add components/dashboard/ScoreCard.tsx components/dashboard/ReviewCard.tsx components/dashboard/ResponseDraft.tsx components/dashboard/PageTransition.tsx app/dashboard/layout.tsx
git commit -m "feat: dashboard component refresh — ScoreCard count-up, ReviewCard platform pills, ResponseDraft typing animation"
```

---

## Task 5: Landing Page — Hero Section

**Files:**
- Create: `components/landing/HeroSection.tsx`

- [ ] **Step 1: Create HeroSection**

Create `components/landing/HeroSection.tsx`:
```typescript
'use client'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { StirLogo } from '@/components/logo/StirLogo'

const FAKE_REVIEWS = [
  { platform: 'Google', rating: 5, author: 'Sarah M.', text: 'Best Italian in town. The carbonara is life-changing.', color: 'bg-blue-50 border-blue-100' },
  { platform: 'Yelp', rating: 2, author: 'James T.', text: 'Service was slow and the risotto arrived cold. Disappointing.', color: 'bg-red-50 border-red-100' },
  { platform: 'TripAdvisor', rating: 4, author: 'Anna W.', text: 'Lovely atmosphere and homemade pasta. Will be back.', color: 'bg-green-light border-green/20' },
]

const WORDS = ['Every', 'review', 'deserves', 'a', 'reply.']

export function HeroSection() {
  const prefersReduced = useReducedMotion()

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: prefersReduced ? 0 : 0.08 } },
  }
  const word = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  return (
    <section className="grain relative bg-cream pt-24 pb-20 px-6 overflow-hidden">
      <div className="mx-auto max-w-3xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center rounded-full bg-orange-light px-4 py-1.5 text-xs font-medium text-orange"
        >
          AI-powered reputation management for restaurants
        </motion.div>

        <motion.h1
          className="mb-6 text-5xl md:text-6xl font-semibold text-brown leading-tight tracking-tight"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {WORDS.map((w, i) => (
            <motion.span key={i} variants={word} className="inline-block mr-[0.25em]">
              {w === 'reply.' ? <span><span className="text-orange">reply.</span></span> : w}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mb-8 text-lg text-text-muted max-w-2xl mx-auto leading-relaxed"
        >
          Stir aggregates your reviews across Google, Yelp, TripAdvisor and delivery platforms, then drafts responses in your voice — so every customer feels heard, without eating your day.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="flex items-center justify-center gap-4 flex-wrap mb-10"
        >
          <Link href="/sign-up" className="rounded-lg bg-orange px-6 py-3 text-base font-medium text-white hover:bg-orange-dark transition-colors shadow-lg shadow-orange/20">
            Start free — no card needed
          </Link>
          <a href="#how-it-works" className="text-sm font-medium text-text-muted hover:text-brown transition-colors">
            See how it works ↓
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="text-xs text-text-lighter mb-12"
        >
          Trusted by 500+ independent restaurants
        </motion.p>

        {/* Animated review feed */}
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          {FAKE_REVIEWS.map((r, i) => (
            <motion.div
              key={r.platform}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.2, duration: 0.5, ease: 'easeOut' }}
              className={`rounded-xl border p-4 text-left shadow-sm ${r.color}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text-muted">{r.platform} · {r.author}</span>
                <span className="text-xs text-orange">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              </div>
              <p className="text-sm text-brown line-clamp-1">{r.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/HeroSection.tsx
git commit -m "feat: animated hero section with word-by-word headline and review feed"
```

---

## Task 6: Landing Page — Problem + Platform Sections

**Files:**
- Create: `components/landing/ProblemSection.tsx`
- Create: `components/landing/PlatformStrip.tsx`

- [ ] **Step 1: Create ProblemSection (sticky)**

Create `components/landing/ProblemSection.tsx`:
```typescript
'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

const PAIN_POINTS = [
  {
    id: 'unanswered',
    content: (
      <div className="rounded-xl border border-red-light bg-red-light/40 p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-red-dark uppercase tracking-wide">1★ · Google · 3 days ago</span>
          <span className="rounded-full bg-red-light text-red-dark text-xs font-medium px-2 py-0.5">No reply</span>
        </div>
        <p className="text-sm text-brown">"Waited 45 minutes for food. No apology, no explanation. Manager was dismissive when we complained. Never coming back."</p>
      </div>
    ),
  },
  {
    id: 'competitor',
    content: (
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-green/30 bg-green-light/40 p-4 text-center">
          <p className="text-xs text-text-muted mb-1">Competitor</p>
          <p className="text-3xl font-semibold text-green">47</p>
          <p className="text-xs text-text-lighter">responses this month</p>
        </div>
        <div className="rounded-xl border border-red-light bg-red-light/40 p-4 text-center">
          <p className="text-xs text-text-muted mb-1">You</p>
          <p className="text-3xl font-semibold text-red-dark">2</p>
          <p className="text-xs text-text-lighter">responses this month</p>
        </div>
      </div>
    ),
  },
  {
    id: 'stat',
    content: (
      <div className="rounded-xl border border-orange/30 bg-orange-light p-6 text-center">
        <p className="text-5xl font-semibold text-orange mb-2">67%</p>
        <p className="text-sm text-text-muted">of diners check reviews before choosing a restaurant</p>
        <p className="text-xs text-text-lighter mt-1">— Google Consumer Insights</p>
      </div>
    ),
  },
]

export function ProblemSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const step = useTransform(scrollYProgress, [0, 0.33, 0.66, 1], [0, 1, 2, 2])

  if (prefersReduced) {
    return (
      <section className="bg-cream-dark py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-semibold text-brown mb-12 text-center">Your reviews are talking.<br />Are you listening?</h2>
          <div className="flex flex-col gap-6">
            {PAIN_POINTS.map(p => <div key={p.id}>{p.content}</div>)}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section ref={containerRef} className="relative bg-cream-dark" style={{ height: '300vh' }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="mx-auto max-w-5xl w-full px-6 grid grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold text-brown leading-snug">
              Your reviews are talking.<br />
              <span className="text-orange">Are you listening?</span>
            </h2>
            <p className="mt-4 text-text-muted text-sm leading-relaxed">
              Every unanswered review is a missed chance to win back a customer — or convert a reader into a guest.
            </p>
          </div>
          <div className="relative h-64">
            {PAIN_POINTS.map((point, i) => (
              <motion.div
                key={point.id}
                className="absolute inset-0"
                animate={{ opacity: Math.round(step.get()) === i ? 1 : 0, y: Math.round(step.get()) === i ? 0 : 16 }}
                transition={{ duration: 0.4 }}
              >
                {point.content}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create PlatformStrip**

Create `components/landing/PlatformStrip.tsx`:
```typescript
'use client'
import { motion } from 'framer-motion'

const PLATFORMS = ['Google', 'Yelp', 'TripAdvisor', 'DoorDash', 'Uber Eats', 'Grubhub']

export function PlatformStrip() {
  return (
    <section className="border-y border-border bg-white py-12 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-8 text-sm font-medium text-text-lighter uppercase tracking-widest">All your reviews, one place</p>
        <div className="flex flex-wrap items-center justify-center gap-10">
          {PLATFORMS.map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              className="text-base font-semibold text-text-muted hover:text-brown transition-colors cursor-default"
            >
              {name}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/ProblemSection.tsx components/landing/PlatformStrip.tsx
git commit -m "feat: sticky problem section and animated platform strip"
```

---

## Task 7: Landing Page — How It Works Section (Sticky)

**Files:**
- Create: `components/landing/HowItWorksSection.tsx`

- [ ] **Step 1: Create HowItWorksSection**

Create `components/landing/HowItWorksSection.tsx`:
```typescript
'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion'

const STEPS = [
  {
    num: '01',
    title: 'Connect your platforms',
    body: 'Link Google, Yelp, TripAdvisor and more in minutes. All your reviews flow into one unified dashboard.',
    mockup: (
      <div className="space-y-2">
        <p className="text-xs text-text-lighter mb-3 uppercase tracking-wide">Connecting platforms</p>
        {['Google', 'Yelp', 'TripAdvisor'].map((p, i) => (
          <motion.div
            key={p}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-center justify-between rounded-lg border border-green/30 bg-green-light/40 px-4 py-2.5"
          >
            <span className="text-sm font-medium text-brown">{p}</span>
            <span className="text-xs text-green font-medium">✓ Connected</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    num: '02',
    title: 'Train your voice',
    body: 'Write 5 sample responses. Stir learns your exact tone, vocabulary, and personality — forever.',
    mockup: (
      <div>
        <p className="text-xs text-text-lighter mb-3 uppercase tracking-wide">Voice training</p>
        <div className="rounded-lg bg-orange-light border border-orange/20 p-4">
          <p className="text-xs text-orange mb-2 font-medium">How would you reply to this 5★ review?</p>
          <p className="text-sm text-brown italic mb-3">"Best meal we've had in years. Pasta was incredible."</p>
          <div className="rounded bg-white border border-border px-3 py-2 text-sm text-brown">
            So glad you loved it! The pasta is made fresh every morning...
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >|</motion.span>
          </div>
        </div>
      </div>
    ),
  },
  {
    num: '03',
    title: 'Approve and post',
    body: 'Stir drafts responses in your voice. Review, edit if you like, then post with one tap.',
    mockup: (
      <div>
        <p className="text-xs text-text-lighter mb-3 uppercase tracking-wide">AI Draft ready</p>
        <div className="rounded-xl border-l-4 border-l-orange border border-orange/20 bg-orange-light p-4">
          <p className="text-xs text-orange font-medium mb-2 uppercase tracking-wide">AI Draft</p>
          <p className="text-sm text-brown mb-3">"So glad you came in! The carbonara is Marco's recipe — he's been making it for 20 years. Hope to see you again soon."</p>
          <div className="flex gap-2">
            <span className="rounded-lg bg-orange text-white text-xs font-medium px-3 py-1.5">Approve & Post</span>
            <span className="rounded-lg border border-border text-xs font-medium px-3 py-1.5 text-brown">Dismiss</span>
          </div>
        </div>
      </div>
    ),
  },
]

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const activeStep = useTransform(scrollYProgress, [0, 0.4, 0.7, 1], [0, 1, 2, 2])

  if (prefersReduced) {
    return (
      <section id="how-it-works" className="bg-white py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-brown mb-4">Up and running in 10 minutes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map(step => (
              <div key={step.num}>
                <div className="w-10 h-10 rounded-full bg-orange-light flex items-center justify-center text-orange font-semibold text-sm mb-4">{step.num}</div>
                <h3 className="font-semibold text-brown text-lg mb-2">{step.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="how-it-works" ref={containerRef} className="relative bg-white" style={{ height: '300vh' }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="mx-auto max-w-5xl w-full px-6 grid grid-cols-2 gap-16 items-center">
          {/* Left: live mockup */}
          <div className="rounded-2xl border border-border bg-cream p-6 shadow-lg min-h-48">
            <AnimatePresence mode="wait">
              {STEPS.map((step, i) => (
                Math.round(activeStep.get()) === i ? (
                  <motion.div
                    key={step.num}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35 }}
                  >
                    {step.mockup}
                  </motion.div>
                ) : null
              ))}
            </AnimatePresence>
          </div>

          {/* Right: step list */}
          <div className="flex flex-col gap-8">
            <h2 className="text-3xl font-semibold text-brown">Up and running in 10 minutes</h2>
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                animate={{ opacity: Math.round(activeStep.get()) === i ? 1 : 0.35 }}
                transition={{ duration: 0.3 }}
                className="flex gap-4"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${Math.round(activeStep.get()) === i ? 'bg-orange text-white' : 'bg-orange-light text-orange'}`}>
                  {step.num}
                </div>
                <div>
                  <h3 className="font-semibold text-brown mb-1">{step.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/HowItWorksSection.tsx
git commit -m "feat: sticky how-it-works section with live mockup transitions"
```

---

## Task 8: Landing Page — Interactive Demo Widget

**Files:**
- Create: `components/landing/DemoWidget.tsx`

- [ ] **Step 1: Create DemoWidget**

Create `components/landing/DemoWidget.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = ['Reviews', 'Score', 'Insights'] as const
type Tab = typeof TABS[number]

const FAKE_REVIEWS = [
  { id: '1', platform: 'Google', rating: 5, author: 'Sarah M.', text: 'Best Italian in Austin. The carbonara is life-changing.', platformColor: 'bg-blue-50 text-blue-600' },
  { id: '2', platform: 'Yelp', rating: 2, author: 'James T.', text: 'Service was slow and my risotto arrived cold. Disappointing.', platformColor: 'bg-red-50 text-red-600' },
  { id: '3', platform: 'TripAdvisor', rating: 4, author: 'Anna W.', text: 'Lovely atmosphere and homemade pasta. Will be back soon.', platformColor: 'bg-green-light text-green' },
]

const FAKE_DRAFT = "So glad you came in, Sarah! The carbonara is Marco's recipe — he's been perfecting it for 20 years. See you again soon!"

function ReviewsTab() {
  const [draftFor, setDraftFor] = useState<string | null>(null)
  const [showDraft, setShowDraft] = useState<string | null>(null)
  const [typing, setTyping] = useState(false)
  const [posted, setPosted] = useState<string | null>(null)

  function handleDraft(id: string) {
    setDraftFor(id)
    setTyping(true)
    setTimeout(() => { setTyping(false); setShowDraft(id) }, 1200)
  }

  return (
    <div className="space-y-3">
      {FAKE_REVIEWS.map(r => (
        <div key={r.id}>
          <div className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${r.platformColor}`}>{r.platform}</span>
                  <span className="text-xs text-orange">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p className="text-sm text-brown line-clamp-1">{r.text}</p>
              </div>
              <div className="shrink-0">
                {posted === r.id ? (
                  <span className="text-xs text-green font-medium">✓ Replied</span>
                ) : showDraft === r.id ? (
                  <span className="text-xs text-orange font-medium">Draft ready</span>
                ) : (
                  <button
                    onClick={() => handleDraft(r.id)}
                    className="rounded-lg bg-orange text-white text-xs font-medium px-3 py-1.5 hover:bg-orange-dark transition-colors"
                  >
                    Draft reply →
                  </button>
                )}
              </div>
            </div>
          </div>
          <AnimatePresence>
            {(draftFor === r.id) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 ml-4 overflow-hidden"
              >
                <div className="rounded-xl border-l-4 border-l-orange border border-orange/20 bg-orange-light p-4">
                  <p className="text-xs font-medium text-orange uppercase tracking-wide mb-2">AI Draft</p>
                  {typing ? (
                    <div className="flex gap-1 py-1">
                      {[0,1,2].map(i => (
                        <motion.div key={i} className="w-2 h-2 rounded-full bg-orange"
                          animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} />
                      ))}
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="text-sm text-brown mb-3">{FAKE_DRAFT}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setPosted(r.id); setDraftFor(null); setShowDraft(null) }}
                          className="rounded-lg bg-orange text-white text-xs font-medium px-3 py-1.5"
                        >
                          Approve & Post
                        </button>
                        <button
                          onClick={() => { setDraftFor(null); setShowDraft(null) }}
                          className="rounded-lg border border-border text-xs font-medium px-3 py-1.5 text-brown"
                        >
                          Dismiss
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

function ScoreTab() {
  const [started, setStarted] = useState(false)
  const [score, setScore] = useState(3.2)

  function animate() {
    setStarted(true)
    const target = 4.3
    const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / 1500, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setScore(Math.round((3.2 + eased * (target - 3.2)) * 10) / 10)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  return (
    <div className="text-center py-6">
      <p className="text-xs text-text-lighter uppercase tracking-wide mb-6">Overall reputation score</p>
      <motion.div className="text-7xl font-semibold text-green mb-2"
        animate={{ scale: started ? [1, 1.05, 1] : 1 }} transition={{ duration: 0.4 }}>
        {score.toFixed(1)}
      </motion.div>
      <div className="flex items-center justify-center gap-1 mb-2">
        <motion.span animate={{ opacity: started ? 1 : 0 }} className="text-green text-sm font-medium">↑ 1.1</motion.span>
        <span className="text-xs text-text-lighter">vs last month</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="rounded-lg bg-cream-dark p-3">
          <p className="text-xs text-text-lighter mb-1">Delivery Score</p>
          <p className="text-xl font-semibold text-amber-dark">3.1</p>
        </div>
        <div className="rounded-lg bg-cream-dark p-3">
          <p className="text-xs text-text-lighter mb-1">Awaiting Reply</p>
          <p className="text-xl font-semibold text-brown">6</p>
        </div>
      </div>
      {!started && (
        <button onClick={animate} className="mt-6 rounded-lg bg-orange text-white text-sm font-medium px-4 py-2 hover:bg-orange-dark transition-colors">
          Watch score improve →
        </button>
      )}
    </div>
  )
}

function InsightsTab() {
  const [readIds, setReadIds] = useState<string[]>([])
  const INSIGHTS = [
    { id: '1', type: 'ALERT', title: 'Slow service complaints up 40%', body: 'Wait time mentions in negative reviews have increased significantly over the last 30 days.', bg: 'bg-red-light', badge: 'bg-red-light text-red-dark' },
    { id: '2', type: 'TIP', title: 'Delivery packaging needs improvement', body: '3 of your last 5 delivery reviews mention spills or cold food on arrival.', bg: 'bg-amber-light', badge: 'bg-amber-light text-amber-dark' },
    { id: '3', type: 'TIP', title: 'Tiramisu is your #1 mentioned dish', body: 'Customers rave about it in 12 recent reviews. Feature it more prominently.', bg: 'bg-green-light', badge: 'bg-green-light text-green' },
  ]

  return (
    <div className="space-y-3">
      {INSIGHTS.map((insight, i) => (
        <motion.div
          key={insight.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: readIds.includes(insight.id) ? 0.5 : 1, x: 0 }}
          transition={{ delay: i * 0.1, duration: 0.35 }}
          className={`rounded-xl border border-border p-4 ${insight.bg}/30`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${insight.badge}`}>{insight.type}</span>
              </div>
              <p className="text-sm font-semibold text-brown mb-0.5">{insight.title}</p>
              <p className="text-xs text-text-muted">{insight.body}</p>
            </div>
            {!readIds.includes(insight.id) && (
              <button onClick={() => setReadIds(p => [...p, insight.id])} className="text-xs text-text-lighter hover:text-orange shrink-0">
                Mark read
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function DemoWidget() {
  const [activeTab, setActiveTab] = useState<Tab>('Reviews')

  return (
    <section className="bg-cream-dark py-24 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-brown mb-4">Try it yourself</h2>
          <p className="text-text-muted">Click through a real demo — no sign-up needed.</p>
        </div>

        <div className="rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
          {/* Mock browser bar */}
          <div className="flex items-center gap-2 border-b border-border bg-cream px-4 py-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-light" />
              <div className="w-3 h-3 rounded-full bg-amber-light" />
              <div className="w-3 h-3 rounded-full bg-green-light" />
            </div>
            <div className="flex-1 text-center text-xs text-text-lighter">app.stirapp.io/dashboard</div>
          </div>

          <div className="flex">
            {/* Mock sidebar */}
            <div className="w-48 bg-brown p-4 min-h-96 hidden md:flex flex-col">
              <div className="text-white font-semibold mb-6 text-sm">stir</div>
              {['Dashboard', 'Reviews', 'Insights'].map((item, i) => (
                <button
                  key={item}
                  onClick={() => setActiveTab(TABS[i] ?? 'Reviews')}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-1 text-sm text-left transition-colors ${activeTab === TABS[i] ? 'bg-orange text-white' : 'text-white/60 hover:bg-brown-mid/50 hover:text-white'}`}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {/* Tab bar (mobile) */}
              <div className="flex gap-1 md:hidden mb-6 bg-cream rounded-lg p-1">
                {TABS.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white text-brown shadow-sm' : 'text-text-muted'}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'Reviews' && <ReviewsTab />}
                  {activeTab === 'Score' && <ScoreTab />}
                  {activeTab === 'Insights' && <InsightsTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/DemoWidget.tsx
git commit -m "feat: interactive demo widget with Reviews/Score/Insights tabs and live animations"
```

---

## Task 9: Landing Page — Pricing, Testimonials, CTA, Footer Sections

**Files:**
- Create: `components/landing/PricingSection.tsx`
- Create: `components/landing/TestimonialsSection.tsx`
- Create: `components/landing/CtaSection.tsx`

- [ ] **Step 1: Create PricingSection**

Create `components/landing/PricingSection.tsx`:
```typescript
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

const PRICING = [
  { name: 'Free', price: '$0', period: '', highlight: false, href: '/sign-up', cta: 'Start free', features: ['3 AI-drafted responses/month', '1 platform connected', 'Basic reputation score', 'Response approval workflow'] },
  { name: 'Starter', price: '$29', period: '/mo', highlight: true, href: '/sign-up', cta: 'Start free trial', features: ['50 AI-drafted responses/month', '3 platforms connected', 'Full insights dashboard', 'Response posting', 'Voice training'] },
  { name: 'Growth', price: '$79', period: '/mo', highlight: false, href: '/sign-up', cta: 'Start free trial', features: ['Unlimited AI responses', 'All platforms', 'Competitor tracking', 'Weekly email reports', 'Priority support'] },
  { name: 'Agency', price: '$199', period: '/mo', highlight: false, href: 'mailto:hello@stirapp.io', cta: 'Contact sales', features: ['Unlimited locations', 'White-label reports', 'Dedicated account manager', 'API access', 'Custom integrations'] },
]

export function PricingSection() {
  return (
    <section id="pricing" className="bg-cream py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-semibold text-brown mb-4">Simple, honest pricing</h2>
          <p className="text-text-muted">Start free. Upgrade when you&apos;re ready.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {PRICING.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              whileHover={{ y: plan.highlight ? -6 : -3 }}
              className={`rounded-2xl border p-6 flex flex-col bg-white ${plan.highlight ? 'border-orange shadow-lg shadow-orange/10 ring-2 ring-orange/20' : 'border-border shadow-sm'}`}
            >
              {plan.highlight && <div className="mb-3 text-xs font-medium text-orange bg-orange-light rounded-full px-3 py-1 w-fit">Most popular</div>}
              <div className="mb-1 font-semibold text-brown">{plan.name}</div>
              <div className="mb-5 flex items-end gap-0.5">
                <span className="text-3xl font-semibold text-brown">{plan.price}</span>
                <span className="text-text-muted text-sm mb-1">{plan.period}</span>
              </div>
              <ul className="flex flex-col gap-2 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-muted">
                    <span className="text-green mt-0.5 shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href={plan.href} className={`rounded-lg px-4 py-2.5 text-sm font-medium text-center transition-colors ${plan.highlight ? 'bg-orange text-white hover:bg-orange-dark' : 'border border-border text-brown hover:bg-cream'}`}>
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create TestimonialsSection**

Create `components/landing/TestimonialsSection.tsx`:
```typescript
'use client'
import { motion } from 'framer-motion'

const TESTIMONIALS = [
  { quote: "We went from ignoring reviews to replying to every single one. Our Google rating went from 3.8 to 4.5 in 3 months.", name: 'Maria Santos', role: 'Owner, Café Paradiso', rating: 5, from: -40 },
  { quote: "The AI sounds exactly like me. Customers have commented that our responses feel personal and genuine. It's wild.", name: 'James Park', role: "Owner, Park's Kitchen", rating: 5, from: 40 },
  { quote: "Stir found a pattern in our delivery reviews I had never noticed. Fixed it. Our DoorDash rating jumped 0.7 stars.", name: 'Elena Moretti', role: 'Owner, Trattoria Elena', rating: 5, from: -40 },
]

export function TestimonialsSection() {
  return (
    <section className="bg-white py-24 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-semibold text-brown mb-4">Restaurants that made the switch</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: t.from }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
              className="rounded-2xl border border-border p-6 bg-cream"
            >
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.3 }}
                className="mb-4 text-orange text-sm"
              >
                {'★'.repeat(t.rating)}
              </motion.div>
              <p className="text-brown text-sm leading-relaxed mb-4">&quot;{t.quote}&quot;</p>
              <div>
                <p className="font-medium text-brown text-sm">{t.name}</p>
                <p className="text-xs text-text-muted">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create CtaSection**

Create `components/landing/CtaSection.tsx`:
```typescript
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { StirLogo } from '@/components/logo/StirLogo'

export function CtaSection() {
  return (
    <>
      <section className="relative bg-brown py-24 px-6 overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(232,99,10,0.15) 0%, transparent 70%)' }} />
        <div className="mx-auto max-w-2xl text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-semibold text-white mb-4"
          >
            Start managing your reputation today
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-white/70 mb-8 leading-relaxed"
          >
            Join 500+ restaurants replying to every review — without hiring a marketing manager.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(232,99,10,0)', '0 0 0 8px rgba(232,99,10,0.15)', '0 0 0 0 rgba(232,99,10,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="inline-block rounded-lg"
            >
              <Link href="/sign-up" className="inline-block rounded-lg bg-orange px-8 py-3.5 text-base font-medium text-white hover:bg-orange-dark transition-colors">
                Get started free
              </Link>
            </motion.div>
          </motion.p>
          <p className="mt-4 text-xs text-white/40">No credit card required · Cancel anytime</p>
        </div>
      </section>

      <footer className="border-t border-border bg-white py-8 px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-sm text-text-lighter flex-wrap gap-4">
          <StirLogo size="sm" />
          <span>© 2026 Stir. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-brown transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-brown transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/landing/PricingSection.tsx components/landing/TestimonialsSection.tsx components/landing/CtaSection.tsx
git commit -m "feat: pricing, testimonials, and CTA/footer sections"
```

---

## Task 10: Assemble Landing Page + Update Nav

**Files:**
- Modify: `app/(marketing)/page.tsx`
- Modify: `app/(marketing)/layout.tsx`

- [ ] **Step 1: Replace landing page with section assembly**

Replace `app/(marketing)/page.tsx` entirely:
```typescript
import { HeroSection } from '@/components/landing/HeroSection'
import { ProblemSection } from '@/components/landing/ProblemSection'
import { PlatformStrip } from '@/components/landing/PlatformStrip'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { DemoWidget } from '@/components/landing/DemoWidget'
import { PricingSection } from '@/components/landing/PricingSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { CtaSection } from '@/components/landing/CtaSection'
import Link from 'next/link'
import { StirLogo } from '@/components/logo/StirLogo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Nav */}
      <nav aria-label="Main" className="sticky top-0 z-50 border-b border-border bg-cream/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <StirLogo size="sm" />
          <div className="hidden md:flex items-center gap-8 text-sm text-text-muted">
            <a href="#how-it-works" className="hover:text-brown transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-brown transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm font-medium text-text-muted hover:text-brown transition-colors">Sign in</Link>
            <Link href="/sign-up" className="rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-dark transition-colors">Start free</Link>
          </div>
        </div>
      </nav>

      <HeroSection />
      <PlatformStrip />
      <ProblemSection />
      <HowItWorksSection />
      <DemoWidget />
      <PricingSection />
      <TestimonialsSection />
      <CtaSection />
    </div>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```
Expected: clean build. Check for any missing import errors.

- [ ] **Step 3: Run dev and verify landing page visually**

```bash
npm run dev
```
Open http://localhost:3000. Verify:
- Stir logo appears in nav
- Hero headline animates word by word
- Review cards slide in
- Platform strip staggers in
- Sticky problem section pins correctly on scroll
- Sticky how-it-works section transitions between steps
- Demo widget tabs work (click Reviews → draft a reply, Score → watch count-up, Insights → mark as read)
- Pricing cards stagger in
- Testimonials slide from alternating sides
- CTA section has pulsing button glow

- [ ] **Step 4: Run tests**

```bash
npm test
```
Expected: 15/15 pass (no regressions).

- [ ] **Step 5: Commit**

```bash
git add "app/(marketing)/page.tsx"
git commit -m "feat: assemble full landing page with all interactive sections"
```

---

## Self-Review: Spec Coverage Check

| Spec requirement | Task |
|---|---|
| Install Framer Motion | Task 1 |
| Warm brown/cream colour tokens | Task 1 |
| Grain texture CSS | Task 1 |
| StirLogo SVG (spoon + wordmark, 3 variants) | Task 2 |
| Logo in sidebar | Task 2 |
| Logo in auth pages | Task 2 |
| MotionCard scroll-reveal wrapper | Task 3 |
| Sidebar brown colours + warm hover | Task 3 |
| ScoreCard count-up animation + coloured left border | Task 4 |
| ReviewCard platform pills + star colours + hover | Task 4 |
| ResponseDraft typing dots + success animation | Task 4 |
| PageTransition wrapper for dashboard | Task 4 |
| Hero: word-by-word headline + animated review feed | Task 5 |
| Sticky problem section (3 pain points) | Task 6 |
| Platform strip with stagger | Task 6 |
| Sticky how-it-works (3 steps, live mockup) | Task 7 |
| Interactive demo widget (Reviews/Score/Insights tabs) | Task 8 |
| Pricing section with stagger + hover lift | Task 9 |
| Testimonials alternating slide-in | Task 9 |
| CTA section with pulsing button | Task 9 |
| Landing page assembly | Task 10 |
| useReducedMotion() on all animated components | Tasks 5,6,7 |
