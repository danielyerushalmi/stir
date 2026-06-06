# Stir Landing — Bug Fix + Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the CSP (restores sign-up/sign-in pages), fix sticky scroll sections, and enhance the landing page with animejs scroll animations, impeccable design polish, and wisprflow voice visualization.

**Architecture:** Two parallel workstreams — (1) CSP-only fix in `next.config.mjs`, (2) landing component rewrites using animejs v4 (already installed at 4.4.1). animejs `seek()`-on-scroll timelines replace framer-motion `useScroll` for the sticky sections. framer-motion is kept only for `whileHover`/`whileTap` micro-interactions that are already working.

**Tech Stack:** animejs 4.4.1 (already in package.json), framer-motion 12 (kept for hover), Next.js 14 App Router, Tailwind CSS, Vitest

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `next.config.mjs` | Modify | Fix CSP to allow Clerk |
| `components/landing/HeroSection.tsx` | Modify | animejs entrance timeline replaces framer-motion entrance |
| `components/landing/PlatformStrip.tsx` | Modify | CSS marquee ticker replaces static grid |
| `components/landing/ProblemSection.tsx` | Modify | animejs scroll-driven timeline fixes sticky bug |
| `components/landing/HowItWorksSection.tsx` | Modify | animejs scroll-driven + wisprflow voice viz fixes sticky bug |
| `components/landing/CtaSection.tsx` | Modify | animejs CSS-based pulse replaces framer-motion loop |
| `components/landing/PricingSection.tsx` | Modify | Impeccable polish — depth hover, card hierarchy |
| `app/globals.css` | Modify | Add marquee keyframe, scroll-reveal base styles |

---

## Task 1: Fix the CSP

**Files:**
- Modify: `next.config.mjs`

The current CSP defaults all directives to `'self'` via `default-src`. This blocks Clerk's scripts, API connections, avatar images, and OAuth iframes — making `<SignUp>` and `<SignIn>` silently fail. Only the `<StirLogo>` rendered above the Clerk component is visible.

- [ ] **Step 1: Read the file**

Open `next.config.mjs` and locate the `Content-Security-Policy` header value (currently a single-line string starting with `"default-src 'self'"`).

- [ ] **Step 2: Replace the CSP value**

Replace the entire `Content-Security-Policy` value with:

```js
{ key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerk.accounts.dev; connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.com; img-src 'self' data: https://img.clerk.com https://images.clerk.dev https://images.unsplash.com; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; frame-src https://*.clerk.com https://*.clerk.accounts.dev; worker-src 'self' blob:; object-src 'none'; base-uri 'none';" },
```

- [ ] **Step 3: Verify build still compiles**

```bash
npm run build
```

Expected: no errors, build succeeds.

- [ ] **Step 4: Manual smoke test**

Start dev server (`npm run dev`), navigate to `/sign-up` in a browser. You should see the full Clerk SignUp UI (email/Google options), not just the logo.

- [ ] **Step 5: Commit**

```bash
git add next.config.mjs
git commit -m "fix: update CSP to allow Clerk domains — restores sign-up and sign-in pages"
```

---

## Task 2: Add Marquee Keyframe to globals.css

**Files:**
- Modify: `app/globals.css`

The platform ticker (Task 3) and any future marquee need this keyframe. Add it once here.

- [ ] **Step 1: Read `app/globals.css`**

- [ ] **Step 2: Append the keyframe and ticker base styles**

```css
/* Platform ticker */
@keyframes ticker {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add ticker keyframe to globals.css"
```

---

## Task 3: Rewrite PlatformStrip as CSS Ticker

**Files:**
- Modify: `components/landing/PlatformStrip.tsx`

Replace the static Tailwind grid with a continuously scrolling CSS marquee. Duplicate the list so the loop is seamless (`-50%` equals one full copy).

- [ ] **Step 1: Read `components/landing/PlatformStrip.tsx`**

- [ ] **Step 2: Replace the entire file content**

```tsx
'use client'

const PLATFORMS: { name: string; live: boolean }[] = [
  { name: 'Google',      live: true },
  { name: 'Yelp',        live: true },
  { name: 'TripAdvisor', live: false },
  { name: 'DoorDash',    live: false },
  { name: 'Uber Eats',   live: false },
  { name: 'Grubhub',     live: false },
]

const DOT = <span className="mx-8 text-border select-none" aria-hidden>·</span>

function PlatformItem({ name, live }: { name: string; live: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 shrink-0">
      <span className={live ? 'text-sm font-semibold text-text-muted' : 'text-sm font-semibold text-text-lighter/50'}>
        {name}
      </span>
      {!live && (
        <span className="rounded-full bg-border px-2 py-0.5 text-[10px] font-medium text-text-lighter">
          Soon
        </span>
      )}
    </span>
  )
}

export function PlatformStrip() {
  const items = PLATFORMS.flatMap((p, i) => [
    <PlatformItem key={`a-${i}`} {...p} />,
    <span key={`da-${i}`} aria-hidden>{DOT}</span>,
  ])

  // Duplicate for seamless loop
  const band = [...items, ...items.map((el, i) =>
    el.key ? { ...el, key: el.key.replace('a-', 'b-').replace('da-', 'db-') } : el
  )]

  return (
    <section className="border-y border-border bg-white py-10 overflow-hidden" aria-label="Supported platforms">
      <p className="mb-6 text-center text-xs font-medium text-text-lighter uppercase tracking-widest">
        All your reviews, one place
      </p>
      <div
        className="flex whitespace-nowrap"
        style={{
          animation: 'ticker 28s linear infinite',
          willChange: 'transform',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'paused')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'running')}
      >
        {band}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add components/landing/PlatformStrip.tsx
git commit -m "feat: replace static platform grid with CSS ticker marquee"
```

---

## Task 4: Rewrite HeroSection with animejs Entrance

**Files:**
- Modify: `components/landing/HeroSection.tsx`

Replace framer-motion entrance animations with an animejs `createTimeline`. Keep framer-motion's `motion.div` wrappers only for `whileHover`/`whileTap` micro-interactions on the CTA button and floating cards.

- [ ] **Step 1: Read `components/landing/HeroSection.tsx`**

- [ ] **Step 2: Replace the entire file content**

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { createTimeline, stagger } from 'animejs'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

const WORDS = ['Every', 'review', 'deserves', 'a', 'reply.']

export function HeroSection() {
  const badgeRef   = useRef<HTMLDivElement>(null)
  const wordsRef   = useRef<(HTMLSpanElement | null)[]>([])
  const subRef     = useRef<HTMLParagraphElement>(null)
  const ctaRef     = useRef<HTMLDivElement>(null)
  const trustRef   = useRef<HTMLParagraphElement>(null)
  const imageRef   = useRef<HTMLDivElement>(null)
  const card1Ref   = useRef<HTMLDivElement>(null)
  const card2Ref   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const words = wordsRef.current.filter(Boolean) as HTMLSpanElement[]

    const tl = createTimeline({ defaults: { ease: 'outExpo' } })
    tl
      .add(badgeRef.current,  { opacity: [0, 1], y: [-8, 0], duration: 500 })
      .add(words,             { opacity: [0, 1], y: [20, 0], duration: 400, delay: stagger(80) }, '-=300')
      .add(subRef.current,    { opacity: [0, 1], duration: 500 }, '-=300')
      .add(ctaRef.current,    { opacity: [0, 1], y: [8, 0], duration: 400 }, '-=200')
      .add(trustRef.current,  { opacity: [0, 1], duration: 400 }, '-=200')
      .add(imageRef.current,  { opacity: [0, 1], y: [20, 0], duration: 700, ease: 'out(3)' }, 300)
      .add(card1Ref.current,  { opacity: [0, 1], y: [10, 0], duration: 500 }, '-=200')
      .add(card2Ref.current,  { opacity: [0, 1], y: [-10, 0], duration: 500 }, '-=400')

    return () => { tl.revert() }
  }, [])

  return (
    <section className="grain relative bg-cream overflow-hidden pt-20 pb-16 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          <div className="relative z-10">
            <div
              ref={badgeRef}
              style={{ opacity: 0 }}
              className="mb-6 inline-flex items-center rounded-full bg-orange-light px-4 py-1.5 text-xs font-medium text-orange cursor-default"
            >
              AI-powered reputation management for restaurants
            </div>

            <h1
              className="mb-6 font-semibold text-brown leading-tight tracking-tight"
              style={{ fontSize: 'clamp(2.75rem, 5vw + 0.5rem, 4.5rem)' }}
            >
              {WORDS.map((w, i) => (
                <span
                  key={i}
                  ref={el => { wordsRef.current[i] = el }}
                  style={{ opacity: 0, display: 'inline-block', marginRight: '0.25em' }}
                >
                  {w === 'reply.' ? <span className="text-orange">reply.</span> : w}
                </span>
              ))}
            </h1>

            <p
              ref={subRef}
              style={{ opacity: 0 }}
              className="mb-8 text-lg text-text-muted max-w-xl leading-relaxed"
            >
              Stir aggregates your reviews across Google, Yelp, TripAdvisor and delivery platforms, then drafts responses in your voice so every customer feels heard — without eating your day.
            </p>

            <div ref={ctaRef} style={{ opacity: 0 }} className="flex items-center gap-4 flex-wrap mb-10">
              <motion.div
                className="inline-block"
                whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                whileTap={{ y: 1, scale: 0.97, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              >
                <Link
                  href="/sign-up"
                  className="block rounded-lg bg-orange px-6 py-3 text-base font-medium text-white hover:bg-orange-dark transition-colors shadow-lg shadow-orange/20"
                >
                  Start free, no card needed
                </Link>
              </motion.div>
              <a href="#how-it-works" className="text-sm font-medium text-text-muted hover:text-brown transition-colors">
                See how it works ↓
              </a>
            </div>

            <p ref={trustRef} style={{ opacity: 0 }} className="text-xs text-text-lighter">
              Trusted by 500+ independent restaurants
            </p>
          </div>

          <div className="relative">
            <div
              ref={imageRef}
              style={{ opacity: 0 }}
              className="relative aspect-[4/3] lg:aspect-[4/5] rounded-2xl shadow-2xl"
            >
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"
                  alt="Warm restaurant dining room"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brown/30 to-transparent pointer-events-none" />
              </div>

              <motion.div
                ref={card1Ref}
                style={{ opacity: 0 }}
                whileHover={{ scale: 1.04, y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                className="absolute bottom-5 left-5 z-10 w-52 rounded-xl border border-green/20 bg-white p-3.5 shadow-xl hidden lg:block cursor-default"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-text-muted">Google · Sarah M.</span>
                  <span className="text-xs text-orange">★★★★★</span>
                </div>
                <p className="text-xs text-brown line-clamp-2 leading-relaxed">Best Italian in town. The carbonara is life-changing.</p>
              </motion.div>

              <motion.div
                ref={card2Ref}
                style={{ opacity: 0 }}
                whileHover={{ scale: 1.04, y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                className="absolute top-5 right-5 z-10 w-52 rounded-xl border border-red-light bg-red-light p-3.5 shadow-xl hidden lg:block cursor-default"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-red-dark">Yelp · James T.</span>
                  <span className="rounded-full bg-white text-red-dark text-xs font-medium px-2 py-0.5">No reply</span>
                </div>
                <p className="text-xs text-brown line-clamp-2 leading-relaxed">Service was slow. The risotto arrived cold. Disappointing.</p>
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/landing/HeroSection.tsx
git commit -m "feat: replace framer-motion hero entrance with animejs timeline"
```

---

## Task 5: Rewrite ProblemSection — animejs Scroll-Driven (Fixes Sticky)

**Files:**
- Modify: `components/landing/ProblemSection.tsx`

Replace framer-motion `useScroll` + `useTransform` with a native `scroll` event listener that calls `tl.seek()`. The sticky CSS stays identical. The animejs timeline drives opacity/transform of the three pain-point panels.

- [ ] **Step 1: Read `components/landing/ProblemSection.tsx`**

- [ ] **Step 2: Replace the entire file content**

```tsx
'use client'
import { useRef, useEffect } from 'react'
import { createTimeline, animate } from 'animejs'

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = String(to)
      return
    }
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      const obj = { value: 0 }
      animate(obj, {
        value: to,
        duration: 1500,
        ease: 'out(3)',
        onUpdate: () => { el.textContent = String(Math.round(obj.value)) },
      })
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [to])
  return <span ref={ref}>0</span>
}

const PAIN_POINTS = [
  {
    id: 'unanswered',
    label: 'Unanswered reviews',
    content: (
      <div className="rounded-xl border border-red-light bg-red-light/40 p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-red-dark uppercase tracking-wide">1★ · Google · 3 days ago</span>
          <span className="rounded-full bg-red-light text-red-dark text-xs font-medium px-2 py-0.5">No reply</span>
        </div>
        <p className="text-sm text-brown">&quot;Waited 45 minutes for food. No apology, no explanation. Manager was dismissive when we complained. Never coming back.&quot;</p>
      </div>
    ),
  },
  {
    id: 'competitor',
    label: 'Falling behind',
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
    label: 'The decision moment',
    content: (
      <div className="rounded-xl border border-orange/30 bg-orange-light p-6 text-center">
        <p className="text-5xl font-semibold text-orange mb-2"><CountUp to={67} />%</p>
        <p className="text-sm text-text-muted">of diners check reviews before choosing a restaurant</p>
        <p className="text-xs text-text-lighter mt-1">— Google Consumer Insights</p>
      </div>
    ),
  },
]

// Mobile: flat list
function MobileVersion() {
  return (
    <section className="bg-cream-dark py-24 px-6">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl font-semibold text-brown mb-12 text-center">
          Your reviews are talking.<br />Are you listening?
        </h2>
        <div className="flex flex-col gap-6">
          {PAIN_POINTS.map(p => <div key={p.id}>{p.content}</div>)}
        </div>
      </div>
    </section>
  )
}

// Desktop: sticky scroll
function DesktopVersion() {
  const containerRef = useRef<HTMLElement>(null)
  const panelRefs   = useRef<(HTMLDivElement | null)[]>([])
  const dotRefs     = useRef<(HTMLDivElement | null)[]>([])
  const labelRefs   = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const container = containerRef.current
    const panels    = panelRefs.current.filter(Boolean) as HTMLDivElement[]
    const dots      = dotRefs.current.filter(Boolean) as HTMLDivElement[]
    if (!container || panels.length < 3 || dots.length < 3) return

    // Set initial state: only panel 0 visible
    panels.forEach((p, i) => { p.style.opacity = i === 0 ? '1' : '0' })
    dots.forEach((d, i)   => { d.style.opacity = i === 0 ? '1' : '0.2'; d.style.scale = i === 0 ? '1.6' : '1' })

    // Timeline: 0–1000ms maps to 0%–100% scroll progress
    const tl = createTimeline({ autoplay: false, defaults: { ease: 'linear', duration: 80 } })

    // At 33% progress: crossfade to panel 1
    tl
      .add(panels[0],  { opacity: 0 }, 300)
      .add(panels[1],  { opacity: 1 }, 300)
      .add(dots[0],    { opacity: 0.2, scale: 1 }, 300)
      .add(dots[1],    { opacity: 1,   scale: 1.6 }, 300)
      // At 66% progress: crossfade to panel 2
      .add(panels[1],  { opacity: 0 }, 630)
      .add(panels[2],  { opacity: 1 }, 630)
      .add(dots[1],    { opacity: 0.2, scale: 1 }, 630)
      .add(dots[2],    { opacity: 1,   scale: 1.6 }, 630)

    let raf = 0
    function update() {
      const rect  = container.getBoundingClientRect()
      const total = container.offsetHeight - window.innerHeight
      const scrolled = -rect.top
      const progress = Math.max(0, Math.min(1, scrolled / total))
      // seek within 0–1000ms; all transitions are placed within this range
      tl.seek(1000 * progress)
    }

    function onScroll() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
      tl.revert()
    }
  }, [])

  return (
    <section ref={containerRef} className="relative bg-cream-dark" style={{ height: '300vh' }}>
      <div className="sticky top-0 h-screen flex items-center" style={{ overflow: 'clip' }}>
        <div className="mx-auto max-w-5xl w-full px-6 grid grid-cols-2 gap-16 items-center">

          {/* Left: headline + dot indicators */}
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold text-brown leading-snug">
              Your reviews are talking.<br />
              <span className="text-orange">Are you listening?</span>
            </h2>
            <p className="mt-4 text-text-muted text-base leading-relaxed">
              Every unanswered review is a missed chance to win back a customer — or convert a reader into a guest.
            </p>

            {/* Dot indicators */}
            <div className="mt-10 flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                {PAIN_POINTS.map((_, i) => (
                  <div
                    key={i}
                    ref={el => { dotRefs.current[i] = el }}
                    className="w-2 h-2 rounded-full bg-orange"
                    style={{ opacity: 0.2 }}
                  />
                ))}
              </div>
              <div className="relative h-5 min-w-[160px]">
                {PAIN_POINTS.map((p, i) => (
                  <span
                    key={p.id}
                    ref={el => { labelRefs.current[i] = el }}
                    className="absolute inset-0 text-sm font-medium text-orange whitespace-nowrap"
                  >
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: stacked panels */}
          <div className="relative h-64">
            {PAIN_POINTS.map((point, i) => (
              <div
                key={point.id}
                ref={el => { panelRefs.current[i] = el }}
                className="absolute inset-0"
                style={{ opacity: 0 }}
              >
                {point.content}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}

export function ProblemSection() {
  return (
    <>
      <div className="md:hidden"><MobileVersion /></div>
      <div className="hidden md:block"><DesktopVersion /></div>
    </>
  )
}
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Smoke test**

Start dev server. Open the landing page on a desktop viewport. Scroll slowly through the "Your reviews are talking" section. You should see:
- Section sticks in place as you scroll through its 300vh height
- Panel crossfades from "Unanswered reviews" → "Falling behind" → "The decision moment" as you scroll

- [ ] **Step 5: Commit**

```bash
git add components/landing/ProblemSection.tsx
git commit -m "fix: replace framer-motion useScroll with animejs timeline.seek — fixes sticky scroll in ProblemSection"
```

---

## Task 6: Rewrite HowItWorksSection — animejs Scroll + WisprFlow Voice

**Files:**
- Modify: `components/landing/HowItWorksSection.tsx`

Same sticky-fix pattern as Task 5. Additionally: replace the blinking cursor in step 2 ("Train your voice") with an animejs-driven waveform visualizer — 5 bars with staggered sine-wave height, orange color, loops continuously.

- [ ] **Step 1: Read `components/landing/HowItWorksSection.tsx`**

- [ ] **Step 2: Replace the entire file content**

```tsx
'use client'
import { useRef, useEffect } from 'react'
import { createTimeline, animate, stagger } from 'animejs'

// Wisprflow-style voice waveform
function VoiceWaveform() {
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const bars = barsRef.current.filter(Boolean) as HTMLDivElement[]
    animate(bars, {
      scaleY: [0.3, 1, 0.3],
      duration: 900,
      delay: stagger(120, { from: 'center' }),
      ease: 'inOutSine',
      loop: true,
    })
    return () => {}
  }, [])
  return (
    <div className="flex items-center justify-center gap-1 h-8" aria-hidden>
      {[0,1,2,3,4].map(i => (
        <div
          key={i}
          ref={el => { barsRef.current[i] = el }}
          className="w-1 rounded-full bg-orange"
          style={{ height: '100%', transformOrigin: 'center', scaleY: 0.3 }}
        />
      ))}
    </div>
  )
}

const STEPS = [
  {
    num: '01',
    title: 'Connect your platforms',
    body: 'Link Google, Yelp, TripAdvisor and more in minutes. All your reviews flow into one unified dashboard.',
    mockup: (
      <div className="space-y-2">
        <p className="text-xs text-text-lighter mb-3 uppercase tracking-wide">Connecting platforms</p>
        {['Google', 'Yelp', 'TripAdvisor'].map((p) => (
          <div
            key={p}
            className="flex items-center justify-between rounded-lg border border-green/30 bg-green-light/40 px-4 py-2.5"
          >
            <span className="text-sm font-medium text-brown">{p}</span>
            <span className="text-xs text-green font-medium">✓ Connected</span>
          </div>
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
          <p className="text-sm text-brown italic mb-3">&quot;Best meal we&apos;ve had in years. Pasta was incredible.&quot;</p>
          <div className="rounded bg-white border border-border px-3 py-2">
            <p className="text-sm text-brown mb-2">So glad you loved it! The pasta is made fresh every morning...</p>
            <VoiceWaveform />
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
        <div className="rounded-xl border border-orange/30 bg-orange-light p-4">
          <p className="text-xs text-orange font-medium mb-2 uppercase tracking-wide">AI Draft</p>
          <p className="text-sm text-brown mb-3">&quot;So glad you came in! The carbonara is Marco&apos;s recipe — he&apos;s been making it for 20 years. Hope to see you again soon.&quot;</p>
          <div className="flex gap-2">
            <span className="rounded-lg bg-orange text-white text-xs font-medium px-3 py-1.5">Approve &amp; Post</span>
            <span className="rounded-lg border border-border text-xs font-medium px-3 py-1.5 text-brown">Dismiss</span>
          </div>
        </div>
      </div>
    ),
  },
]

function MobileVersion() {
  return (
    <section id="how-it-works" className="bg-white py-24 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold text-brown mb-4">Up and running in 10 minutes</h2>
          <p className="text-text-muted">No long setup. No technical knowledge required.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map(step => (
            <div key={step.num}>
              <div className="w-10 h-10 rounded-full bg-orange-light flex items-center justify-center text-orange font-semibold text-sm mb-4">{step.num}</div>
              <h3 className="font-semibold text-brown text-lg mb-2">{step.title}</h3>
              <p className="text-text-muted text-base leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DesktopVersion() {
  const containerRef  = useRef<HTMLElement>(null)
  const mockupRefs    = useRef<(HTMLDivElement | null)[]>([])
  const stepRefs      = useRef<(HTMLDivElement | null)[]>([])
  const numCircleRefs = useRef<(HTMLDivElement | null)[]>([])
  const barRef        = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const mockups   = mockupRefs.current.filter(Boolean) as HTMLDivElement[]
    const steps     = stepRefs.current.filter(Boolean) as HTMLDivElement[]
    const circles   = numCircleRefs.current.filter(Boolean) as HTMLDivElement[]
    const bar       = barRef.current
    if (!container || mockups.length < 3) return

    // Initial state
    mockups.forEach((m, i) => { m.style.opacity = i === 0 ? '1' : '0' })
    steps.forEach((s, i)   => { s.style.opacity = i === 0 ? '1' : '0.35' })
    circles.forEach((c, i) => {
      c.classList.toggle('bg-orange', i === 0)
      c.classList.toggle('bg-orange-light', i !== 0)
      const span = c.querySelector('span')
      if (span) span.className = i === 0 ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-orange'
    })

    const tl = createTimeline({ autoplay: false, defaults: { ease: 'linear', duration: 80 } })

    // Progress bar
    if (bar) {
      tl
        .add(bar, { width: '33%', duration: 330 }, 0)
        .add(bar, { width: '66%', duration: 300 }, 330)
        .add(bar, { width: '100%', duration: 290 }, 630)
    }

    // Mockup crossfades at 33% and 66%
    tl
      .add(mockups[0],  { opacity: 0 }, 300)
      .add(mockups[1],  { opacity: 1 }, 300)
      .add(steps[0],    { opacity: 0.35 }, 300)
      .add(steps[1],    { opacity: 1 }, 300)
      .add(mockups[1],  { opacity: 0 }, 630)
      .add(mockups[2],  { opacity: 1 }, 630)
      .add(steps[1],    { opacity: 0.35 }, 630)
      .add(steps[2],    { opacity: 1 }, 630)

    let raf = 0
    function update() {
      const rect  = container.getBoundingClientRect()
      const total = container.offsetHeight - window.innerHeight
      const progress = Math.max(0, Math.min(1, -rect.top / total))
      tl.seek(1000 * progress) // 0–1000ms range; all transitions sit within this window
    }

    function onScroll() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
      tl.revert()
    }
  }, [])

  return (
    <section id="how-it-works" ref={containerRef} className="relative bg-white" style={{ height: '300vh' }}>
      <div className="sticky top-0 h-screen flex items-center" style={{ overflow: 'clip' }}>
        <div className="mx-auto max-w-5xl w-full px-6 grid grid-cols-2 gap-16 items-center">

          {/* Left: mockup panel */}
          <div className="rounded-2xl border border-border bg-cream shadow-lg overflow-hidden">
            <div className="h-0.5 w-full bg-orange/10 relative">
              <div ref={barRef} className="h-full bg-orange absolute left-0 top-0" style={{ width: '33%' }} />
            </div>
            <div className="relative min-h-48">
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  ref={el => { mockupRefs.current[i] = el }}
                  className="absolute inset-0 p-6"
                  style={{ opacity: 0 }}
                >
                  {step.mockup}
                </div>
              ))}
            </div>
          </div>

          {/* Right: step cards */}
          <div className="flex flex-col gap-8">
            <h2 className="text-3xl font-semibold text-brown">Up and running in 10 minutes</h2>
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                ref={el => { stepRefs.current[i] = el }}
                className="flex gap-4"
                style={{ opacity: 0.35 }}
              >
                <div
                  ref={el => { numCircleRefs.current[i] = el }}
                  className="w-10 h-10 shrink-0 rounded-full bg-orange-light flex items-center justify-center"
                >
                  <span className="text-sm font-semibold text-orange">{step.num}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-brown mb-1">{step.title}</h3>
                  <p className="text-text-muted text-base leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}

export function HowItWorksSection() {
  return (
    <>
      <div className="md:hidden"><MobileVersion /></div>
      <div className="hidden md:block"><DesktopVersion /></div>
    </>
  )
}
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Smoke test**

Scroll through "Up and running in 10 minutes." Steps should advance in sync with scroll. Step 2 mockup should show the animated orange waveform bars.

- [ ] **Step 5: Commit**

```bash
git add components/landing/HowItWorksSection.tsx
git commit -m "fix: animejs scroll-driven timeline fixes sticky in HowItWorksSection; add wisprflow voice waveform"
```

---

## Task 7: Reanimate CtaSection Pulse with animejs

**Files:**
- Modify: `components/landing/CtaSection.tsx`

Replace framer-motion's `animate` loop with a CSS `box-shadow` pulse via animejs. This avoids the deprecated framer-motion looping pattern.

- [ ] **Step 1: Read `components/landing/CtaSection.tsx`**

- [ ] **Step 2: Replace the CTA section content**

Replace the `CtaSection` component with the following (keeping the footer unchanged):

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import Link from 'next/link'
import { StirLogo } from '@/components/logo/StirLogo'

function PulsingCta() {
  const wrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = wrapRef.current
    if (!el) return
    animate(el, {
      boxShadow: [
        '0 0 0 0px rgba(232,99,10,0)',
        '0 0 0 10px rgba(232,99,10,0.15)',
        '0 0 0 0px rgba(232,99,10,0)',
      ],
      duration: 2500,
      ease: 'inOutSine',
      loop: true,
    })
    return () => {}
  }, [])
  return (
    <div ref={wrapRef} className="inline-block rounded-lg">
      <Link href="/sign-up" className="inline-block rounded-lg bg-orange px-8 py-3.5 text-base font-medium text-white hover:bg-orange-dark transition-colors">
        Get started free
      </Link>
    </div>
  )
}

export function CtaSection() {
  return (
    <>
      <section className="relative bg-brown py-24 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(232,99,10,0.15) 0%, transparent 70%)' }}
        />
        <div className="mx-auto max-w-2xl text-center relative z-10">
          <h2 className="text-3xl font-semibold text-white mb-4">
            Start managing your reputation today
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            Join 500+ restaurants replying to every review — without hiring a marketing manager.
          </p>
          <PulsingCta />
          <p className="mt-4 text-xs text-white/40">No credit card required · Cancel anytime</p>
        </div>
      </section>

      <footer className="border-t border-border bg-white py-8 px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-sm text-text-lighter flex-wrap gap-4">
          <StirLogo size="sm" />
          <span>© 2026 Stir. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-brown transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-brown transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/landing/CtaSection.tsx
git commit -m "feat: replace framer-motion CTA pulse with animejs box-shadow loop"
```

---

## Task 8: Final Build and Smoke Test

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`, zero TypeScript errors, zero ESLint errors.

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass (or the same tests that passed before — this PR touches only landing UI).

- [ ] **Step 3: Manual smoke test checklist**

Start dev server (`npm run dev`) and verify:

| Check | Expected |
|-------|---------|
| `/sign-up` | Full Clerk SignUp UI loads (not just logo) |
| `/sign-in` | Full Clerk SignIn UI loads (not just logo) |
| Landing hero | Words animate in staggered on load |
| Platform strip | Ticker scrolls continuously, pauses on hover |
| "Unanswered reviews" section | Panel sticks and crossfades through 3 steps on scroll (desktop) |
| "How it works" section | Sticks, steps advance on scroll, voice waveform animates in step 2 |
| CTA section | Orange pulse ring loops on the button |
| All pricing "Start free" buttons | Navigate to `/sign-up` and show Clerk UI |

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: landing page bugfix + animejs redesign complete"
```
