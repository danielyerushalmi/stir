# Prompt for Claude Fable 5 — Stir Landing Page Reinvention (v2)

Paste everything below the line into Fable 5 / Claude Design as one message.

---

Design a completely new landing page for **Stir**, an AI-powered reputation management tool for independent restaurants. This is a full creative reinvention — do not reuse the current visual system (warm orange/brown/cream palette, current layout, or section order). Start from a blank slate and propose your own art direction, typography, layout, and motion language. Output a single, self-contained HTML mockup (HTML/CSS/JS, frontend only — no backend, no real data, no forms that submit anywhere). It needs to look and behave like a real, shippable product page — test it as an actual page in a browser tab, not just inside a preview sandbox. That means: proper viewport meta tag, no fixed/cropped dimensions that only look right in an iframe, content that reflows correctly at real browser widths, and a page that scrolls and loads the way a real site would.

## Color system — base it on Claude's own

Use Anthropic/Claude's actual brand palette as your foundation, then build a warm orange-and-brown identity out of it rather than reusing generic web-orange:

- Dark: `#141413` (near-black, warm) — primary text / dark sections
- Light: `#faf9f5` (warm off-white) — primary background
- Mid Gray: `#b0aea5` — secondary/muted elements
- Light Gray: `#e8e6dc` — subtle backgrounds, borders
- Orange: `#d97757` (terracotta, primary accent)
- Blue: `#6a9bcc` and Green: `#788c5d` (use sparingly if at all — this page should feel orange/brown-led)

Derive your own warm browns and deeper terracotta/rust shades from this system (e.g., darkening `#d97757` or mixing it with `#141413`) rather than importing Stir's old brown (`#2C1810`). The palette should feel unmistakably warm, earthy, and confident — not a SaaS-blue system wearing an orange coat.

## Typography

Reference point, not a mandate: Claude's brand system pairs Poppins (headings) with Lora (body). Feel free to choose different faces if they serve the concept better, but the pairing should have that same confident-display / warm-serif-or-humanist-body character rather than a generic geometric sans doing everything.

## Hero requirements

- The hero must fill the entire viewport on load (100vh, no cramped half-screen hero above a visible fold of content).
- Do not use the "one word in a different font/color" hero trick — it's overdone. Find a different way to create emphasis and rhythm in the headline (scale, weight, layout, motion, negative space — your call).
- Take inspiration from Anthropic's own site (claude.com / anthropic.com): a large, confident, editorial typographic statement, generous whitespace, restrained but purposeful motion — things expand, scale, or reveal on load/scroll rather than just fading in.
- The hero should feel like an entrance, not a banner.

## Motion & structure — sticky sections and real transitions

Several of the current sections (problem framing, how-it-works, pricing, testimonials) are static and forgettable. Rework them using sticky/scroll-driven techniques so scrolling *reveals* the story rather than just stacking cards:

- Consider sticky panels where the copy or visual holds in place while content crossfades/transforms underneath or beside it as the user scrolls (similar in spirit to how lusion.co and oryzo.ai use scroll position to drive state changes, not just entrance animations).
- Consider unexpected transitions between sections — a section that pins and morphs into the next, a stat that builds as it's scrolled into view, a testimonial treatment that's more editorial than "3 cards in a row."
- Look at oryzo.ai for tone/craft inspiration on how to make small, specific product facts (a stat, a comparison, a proof point) feel delightful and alive rather than like a bullet list — not its literal jokey copy, but the level of craft and specificity in how each fact gets its own moment.
- Look at lusion.co for inspiration on cinematic scroll pacing, momentum, and confident full-bleed typographic sections.
- Respect `prefers-reduced-motion` — provide a non-scroll-jacked fallback for every sticky/scrubbed section.

## Do your own research

Before or while building, look at oryzo.ai, lusion.co, and claude.com/anthropic.com directly for visual and motion reference — don't rely solely on this description. If you're not able to browse them, or want a second opinion on a direction, ask — Daniel (the person prompting you) is available to describe, screenshot, or fetch reference material for you. Ask any clarifying questions you need, about the product, the content, or the direction, before or during the build, rather than guessing silently.

## The product

Stir aggregates a restaurant's reviews from Google, Yelp, TripAdvisor, and delivery platforms (DoorDash, Uber Eats, Grubhub) into one dashboard, then drafts reply responses in the owner's own voice so every review gets answered without eating the owner's day. The owner trains Stir's voice by writing a handful of sample replies; after that, Stir drafts responses the owner can approve and post in one tap, or edit first.

## Who it's for

Independent restaurant owners and managers — not marketers, not technical people, often running the place themselves. They're time-poor, care deeply about their reputation, and have been either ignoring reviews entirely or spending time they don't have writing replies by hand.

## Why it matters (use for problem framing, not verbatim copy)

- 67% of diners check reviews before choosing a restaurant (Google Consumer Insights).
- Every unanswered review is a missed chance to win back an unhappy customer or convert a reader into a guest.
- Competitors who reply consistently are winning the decision moment; most independent restaurants reply to almost nothing.

## Core value props to communicate

1. **One inbox for every platform** — Google, Yelp, TripAdvisor, and delivery apps, unified.
2. **Sounds like you, not a bot** — Stir learns the owner's actual tone and vocabulary from a few sample replies.
3. **Minutes, not hours** — draft, approve, post. No writing from scratch.
4. **Built for non-technical owners** — set up in about 10 minutes, no technical knowledge required.

## Real proof points to include somewhere (facts, reword freely)

- Trusted by 500+ independent restaurants.
- Maria Santos, Owner of Café Paradiso: went from ignoring reviews to replying to every one; Google rating rose from 3.8 to 4.5 in 3 months.
- James Park, Owner of Park's Kitchen: "The AI sounds exactly like me."
- Elena Moretti, Owner of Trattoria Elena: Stir surfaced a recurring complaint in delivery reviews; fixing it raised their DoorDash rating by 0.7 stars.

## Pricing to represent (4 tiers)

| Plan | Price | Highlights |
|---|---|---|
| Free | $0 | 3 AI-drafted responses/mo, 1 platform, basic reputation score |
| Starter | $29/mo (most popular) | 50 responses/mo, 3 platforms, full dashboard, voice training |
| Growth | $79/mo | Unlimited responses, all platforms, competitor tracking, weekly reports |
| Agency | $199/mo | Unlimited locations, white-label reports, dedicated account manager, API access |

## Primary calls to action

"Start free, no card needed" and "Get started free" — no credit card required, cancel anytime.

## Constraints

- Must be fully responsive (mobile through desktop) — not just styled for a fixed sandbox viewport.
- Must be legible and high-contrast; don't sacrifice accessibility for style.
- Respect `prefers-reduced-motion` for any animation, including sticky/scroll-scrubbed sections.
- One cohesive page: hero, problem/why-it-matters, how it works, pricing, testimonials, final CTA — reorder, merge, or restructure these beats however best serves your concept.

## Creative brief

Surprise us. Treat "AI tool for restaurants" as an opportunity, not a constraint that forces food photography and orange gradients — a sharper, more premium, more editorial, or more unexpected direction is welcome as long as it still reads as trustworthy to a busy restaurant owner deciding whether to hand over their online reputation to software. Be original — avoid landing-page clichés (the two-font hero word, generic fade-up-on-scroll cards, stock SaaS gradients). If something in this brief is ambiguous or you see a better path, ask rather than defaulting to the safe/generic version.
