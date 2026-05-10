# Stir Visual Refresh — Design Spec

**Date:** 2026-05-10
**Scope:** Logo, landing page rebuild with scroll/sticky animations + interactive demo, dashboard moderate refresh

---

## Overview

A visual and interactive upgrade to Stir's landing page and dashboard. The goal is a **warm and approachable** feel that resonates with independent restaurant owners — not corporate SaaS energy. The landing page becomes a showcase with scroll storytelling, sticky pin sections, and a live-clickable demo widget. The dashboard gets a polish pass with improved components and warmer colours.

---

## Colour System (Evolved)

Replace existing tokens with warmer variants:

```css
--cream: #FAF7F2              /* page background (replaces warm-gray) */
--cream-dark: #F2EDE4         /* card/section backgrounds */
--brown: #2C1810              /* headlines, sidebar (replaces charcoal) */
--brown-mid: #5C3D2E          /* secondary text */
--orange: #E8630A             /* primary CTA (unchanged) */
--orange-dark: #C4520A        /* hover (unchanged) */
--orange-light: #FEF0E7       /* tinted backgrounds (unchanged) */
--border: #E8DDD2             /* warmer border */
--green: #2D9B6F              /* unchanged */
--green-light: #EAF3DE        /* unchanged */
--red-dark: #A32D2D           /* unchanged */
--red-light: #FCEBEB          /* unchanged */
--amber-dark: #633806         /* unchanged */
--amber-light: #FAEEDA        /* unchanged */
--text-muted: #5C3D2E         /* maps to brown-mid */
--text-lighter: #9C8778       /* warmer light text */
```

Update `tailwind.config.ts` to add `cream`, `cream-dark`, `brown`, `brown-mid` tokens. Replace `charcoal` usages in dashboard with `brown`. Replace `warm-gray` usages with `cream`.

---

## Logo

**Design:** SVG spoon icon with bowl forming a subtle curve/smile. Tilted 15° counter-clockwise. Sits left of lowercase "stir" wordmark in Inter 600. Clean, warm, recognisable.

**Component:** `components/logo/StirLogo.tsx`
- Props: `size` (sm/md/lg), `variant` (full | icon-only | white)
- `full` — spoon icon + "stir" wordmark (nav, landing, auth pages)
- `icon-only` — spoon only (favicon, collapsed sidebar)
- `white` — full logo in white (dark backgrounds, CTA section)

**SVG spoon path:** Simple geometric spoon — oval bowl at top, thin handle curving down. Filled with `currentColor` so it inherits text colour.

---

## New Dependencies

```bash
npm install framer-motion
```

No other new dependencies. Grain texture is pure CSS, logo is inline SVG, typing animation uses Framer Motion.

---

## Landing Page Rebuild

### File Structure

The monolithic `app/(marketing)/page.tsx` is broken into focused section components:

```
components/landing/
  HeroSection.tsx
  ProblemSection.tsx        ← sticky pin section 1
  PlatformStrip.tsx
  HowItWorksSection.tsx     ← sticky pin section 2
  DemoWidget.tsx            ← interactive 3-tab demo
  PricingSection.tsx
  TestimonialsSection.tsx
  CtaSection.tsx
components/ui/
  MotionCard.tsx            ← reusable scroll-fade-up wrapper
components/logo/
  StirLogo.tsx
app/(marketing)/page.tsx    ← imports sections, minimal orchestration
```

### Motion Principles

- **Load animations:** Hero elements animate in on mount (word-by-word headline, staggered review cards)
- **Sticky pins:** Two sections use `position: sticky` with scroll-driven content transitions
- **Scroll reveals:** All other sections use Framer Motion `whileInView` with `viewport={{ once: true }}`
- **Interactive:** Demo widget uses React state + Framer Motion for tab transitions and typing effect
- **Performance:** `will-change: transform` only on actively animating elements. `once: true` on all scroll triggers to avoid re-animation.

### Hero Section (`HeroSection.tsx`)

- Cream background with subtle CSS grain texture (`background-image: url("data:image/svg+xml,...")`)
- Headline "Every review deserves a reply." animates word-by-word using `staggerChildren`
- Below headline: 3 animated review card previews slide up staggered (Google 5★, Yelp 2★, TripAdvisor 4★) — purely decorative, shows the product immediately
- Two CTAs: "Start free" (orange filled) + "See how it works ↓" (ghost, scrolls to `#how-it-works`)
- Social proof: "Trusted by 500+ independent restaurants"

### Sticky Section 1 — The Problem (`ProblemSection.tsx`)

Uses `position: sticky` pinning. Layout: left panel fixed, right panel scrolls.

**Left (pinned):** Headline "Your reviews are talking. Are you listening?" + subtext

**Right (scrolls through 3 pain points):**
1. A 1-star review card with no response — red badge "Unanswered"
2. Side-by-side: competitor profile (47 replies) vs yours (2 replies)
3. Stat callout: "67% of diners check reviews before choosing a restaurant" — number counts up with Framer Motion when in view

Each pain point fades in as it scrolls into the sticky viewport.

### Platform Strip (`PlatformStrip.tsx`)

- "All your reviews, one place" label
- 6 platform names animate in with stagger
- A stat counter animates: "40+ reviews tracked" counting up

### Sticky Section 2 — How Stir Works (`HowItWorksSection.tsx`)

Uses `position: sticky` pinning. Layout: left panel fixed (mockup), right panel scrolls through 3 steps.

**Left (pinned):** Phone/browser frame mockup that updates as each step scrolls in:
- Step 1 (Connect): Platform logos animate connecting with lines
- Step 2 (Train): A voice waveform animation
- Step 3 (Approve): A draft response typing itself in

**Right (scrolls):** Step cards (01/02/03) with title + description. When each card hits the viewport, the left mockup transitions to match.

Step detection: track scroll position with `useScroll` + `useTransform` to determine active step.

### Interactive Demo Widget (`DemoWidget.tsx`)

Self-contained, no API calls, pure React state + fake data.

**3 tabs:**

**Tab 1 — Reviews:**
- 3 fake review cards (The Corner Table mock data)
- Click "Draft reply →" on any card → typing indicator (3 bouncing dots, 1.5s) → draft text appears with a typewriter animation
- "Approve & Post" button → green success state with checkmark

**Tab 2 — Score:**
- Animated gauge/number counting from 3.2 → 4.3 over 1.5s on tab activation
- Trend arrow animates up with delta
- Delivery score shown separately

**Tab 3 — Insights:**
- 2 insight cards flip/fade in staggered
- ALERT badge (red) and TIP badge (orange)
- "Mark as read" fades the card

Tab transitions use Framer Motion `AnimatePresence` with crossfade.

### Pricing Section (`PricingSection.tsx`)

- 4 plan cards stagger in with `whileInView`
- Starter (highlighted) scales up slightly on hover
- All cards get `whileHover={{ y: -4 }}` lift effect

### Testimonials Section (`TestimonialsSection.tsx`)

- 3 cards slide in from alternating sides (left, right, left) with `whileInView`
- Star ratings animate in after card appears

### CTA Section (`CtaSection.tsx`)

- Brown background (warm dark)
- "Get started free" button with a subtle pulse animation
- Background has a very subtle radial gradient from orange-dark at centre

---

## Dashboard Moderate Refresh

### Colour Updates

- Sidebar background: `bg-brown` (was `bg-charcoal`)
- Page background: `bg-cream` (was `bg-warm-gray`)
- Cards: `bg-cream-dark` or `bg-white` with warmer shadows

### Sidebar (`components/dashboard/Sidebar.tsx`)

- `bg-brown` background
- Active nav item: orange background + `box-shadow: inset 3px 0 0 #E8630A` left border glow
- Hover state: `bg-brown-mid/30` (warm tint, not cold white/10)
- Replace text "stir" with `<StirLogo variant="white" size="sm" />`
- Collapse chevron updated to match new colours

### ScoreCard (`components/dashboard/ScoreCard.tsx`)

- Soft drop shadow: `shadow-sm` → `shadow-md` with warm tint
- Left border strip: 3px coloured strip (green/amber/red) matching score colour
- Score number: Framer Motion count-up animation on mount
- Background: `bg-white` with `border-border` (warmer border token)

### ReviewCard (`components/dashboard/ReviewCard.tsx`)

- Platform name: coloured pill badge
  - Google → blue pill (`bg-blue-50 text-blue-600`)
  - Yelp → red pill (`bg-red-50 text-red-600`)
  - TripAdvisor → green pill (`bg-green-light text-green`)
  - Delivery platforms → gray pill
- Star rating: actual `★` characters, filled = orange, empty = gray
- "Draft reply →" button: arrow animates right on hover (`whileHover`)
- Card gets subtle `whileHover={{ y: -1 }}` lift

### ResponseDraft (`components/dashboard/ResponseDraft.tsx`)

- Typing indicator: 3 bouncing dots shown for 1s before draft text appears (when draft is first loaded)
- Orange-light background with 3px orange left border strip
- "Approve & Post" success: checkmark SVG animates in, text changes to "Posted!"
- Framer Motion `AnimatePresence` for smooth mount/unmount

### Page Transitions (`app/dashboard/layout.tsx`)

- Wrap `{children}` in a Framer Motion `motion.div` with `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` — subtle 150ms fade between pages

---

## Implementation Notes

- All Framer Motion animations use `reduced-motion` media query respect via `useReducedMotion()` hook — animations disable for users who prefer reduced motion
- Sticky sections use `position: sticky` + `top: 0` with a tall scroll container — no scroll-jacking, native browser scroll preserved
- Demo widget is entirely client-side (`'use client'`) with no API calls — fake data hardcoded
- Color token migration: do a find-replace pass on `charcoal` → `brown` and `warm-gray` → `cream` across all files after updating `tailwind.config.ts`

---

## Out of Scope

- Mobile hamburger menu (noted as a known gap, deferred)
- Dark mode
- Any backend changes
- Vercel deployment config
