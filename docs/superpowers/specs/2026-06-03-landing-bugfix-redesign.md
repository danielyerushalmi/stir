# Stir Landing Page — Bug Fix + Design Renovation
**Date**: 2026-06-03  
**Status**: Approved

## Problem

Two critical bugs block users before they can sign up:

1. **Sign-up / sign-in pages show only the logo** — The Content-Security-Policy in `next.config.mjs` defaults all directives to `'self'`, which silently blocks Clerk's external scripts, styles, fonts, API connections, and OAuth iframes. The `<SignUp>` and `<SignIn>` components render nothing; only the `<StirLogo>` above them appears.

2. **Sticky scroll sections don't stick** — `ProblemSection` and `HowItWorksSection` use a 300vh tall container + `sticky top-0 h-screen` inner panel driven by framer-motion `useScroll`. On scroll the panel doesn't stick; the user scrolls through blank space and sees the final animation state (step 3) jump into view. Root cause: scroll tracking unreliable with the current ref + hidden/block pattern.

Additionally, the landing page animations use framer-motion but would benefit from animejs timeline control, impeccable design polish, and wisprflow-style voice visualization.

## Scope

**In scope**: `next.config.mjs`, `app/(auth)` pages, all `components/landing/` files, `app/globals.css`  
**Out of scope**: Dashboard, API routes, Clerk configuration, Prisma schema, onboarding flow

## Architecture

Two parallel swarm teams coordinated via ruflo memory-as-bus, merged by a reviewer agent.

```
Lead (orchestrator)
├── Team Bug (coder) — owns next.config.mjs ONLY
│   └── Fix CSP (Clerk domains across all directives)
├── Team Design (architect + coder) — owns all components/landing/ files
│   ├── animejs integration — this IS the sticky fix for HowItWorksSection + ProblemSection
│   ├── impeccable design pass (typography, spacing, color, grain)
│   └── wisprflow voice animation in HowItWorksSection step 2
└── Reviewer — validates all changes, checks no regressions
```

File ownership is strict: Team Bug touches only `next.config.mjs`. Team Design touches only `components/landing/`. No file is edited by both teams.

## Bug Fix Specs

### 1. CSP Fix (`next.config.mjs`)

Replace the current `Content-Security-Policy` value with one that allows Clerk's required origins while keeping security intact for everything else:

| Directive | Required additions |
|-----------|-------------------|
| `default-src` | `'self'` (unchanged) |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev` |
| `connect-src` | `'self' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://api.clerk.com` |
| `img-src` | `'self' data: https://img.clerk.com https://images.clerk.dev https://images.unsplash.com` |
| `style-src` | `'self' 'unsafe-inline'` |
| `font-src` | `'self' https://fonts.gstatic.com` |
| `frame-src` | `https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev` |
| `worker-src` | `'self' blob:` |

### 2. Sticky Section Fix (`ProblemSection.tsx`, `HowItWorksSection.tsx`)

Replace framer-motion `useScroll` + ref approach with animejs scroll-driven animation:
- Use `animate()` with a scroll-linked progress value derived from a native `scroll` event listener on the container
- Attach the listener in `useEffect` with proper cleanup
- Use `requestAnimationFrame` debouncing for smooth tracking
- Remove the `hidden md:block` / `md:hidden` pattern in favor of CSS-only responsive fallback that doesn't affect the ref attachment

## Design Improvement Specs

### animejs integration

Install `animejs` (v4). Replace framer-motion in these landing components:
- `HeroSection.tsx` — word-by-word reveal timeline
- `PlatformStrip.tsx` — animated ticker / stagger entrance
- `HowItWorksSection.tsx` — scroll-driven step transitions (also fixes sticky bug)
- `ProblemSection.tsx` — scroll-driven panel transitions (also fixes sticky bug)
- `CtaSection.tsx` — pulse ring animation on CTA button

Keep framer-motion for simple `whileHover` / `whileTap` interactions where it's already working.

### Impeccable design pass

Apply impeccable brand principles across all landing sections:
- Tighter typographic scale — hero headline uses `clamp` range tuned for impact at all sizes
- Consistent vertical rhythm — section padding standardized to `py-24` / `py-32` pattern
- Grain texture on hero and CTA sections elevated (increase opacity slightly, extend to CTA)
- Color discipline — orange used only for CTAs, key stats, active states; no decorative orange
- Button hierarchy — primary (orange fill), secondary (ghost border), text link; no mixed patterns
- Whitespace audit — remove padding/margin inconsistencies across sections

### WisprFlow voice animation

In `HowItWorksSection.tsx` step 2 ("Train your voice"), replace the static blinking cursor mockup with an animejs-driven audio waveform visualizer:
- 5 bars with staggered sine-wave height animation
- Color: orange, low opacity at rest, full opacity while "speaking"
- Loops continuously; respects `prefers-reduced-motion`

### Platform strip ticker

Replace the static grid of platform names with a continuous horizontal ticker:
- Duplicated list for seamless loop
- animejs translate X loop, pauses on hover
- Live platforms (Google, Yelp) at full opacity; Coming Soon at 40%

## Error Handling

- If animejs package install fails, fall back to CSS transitions for new animations; framer-motion stays for scroll sections
- CSP changes are additive — existing strict defaults remain for all non-Clerk resources
- All animations respect `prefers-reduced-motion` via `useReducedMotion()` hook or `matchMedia` check

## Testing

- [ ] Sign-up page renders full Clerk UI (not just logo)
- [ ] Sign-in page renders full Clerk UI
- [ ] ProblemSection sticks during scroll on desktop
- [ ] HowItWorksSection sticks and steps advance on scroll
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] Hero animates word-by-word on load
- [ ] Platform ticker loops smoothly, pauses on hover
- [ ] WisprFlow waveform animates in step 2
- [ ] All pricing CTAs link to `/sign-up` and load correctly
- [ ] Mobile layout unchanged (responsive fallbacks intact)
