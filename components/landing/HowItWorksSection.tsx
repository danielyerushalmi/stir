'use client'
import { useRef, useEffect } from 'react'
import { useReducedMotion } from 'framer-motion'
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
          style={{ height: '100%', transformOrigin: 'center', transform: 'scaleY(0.3)' }}
        />
      ))}
    </div>
  )
}

const STEPS = [
  {
    num: '01',
    title: 'Connect your platforms',
    body: 'Link Google in minutes — Yelp, TripAdvisor and more are coming soon. All your reviews flow into one unified dashboard.',
    mockup: (
      <div className="space-y-2">
        <p className="text-xs text-text-lighter mb-3 uppercase tracking-wide">Connecting platforms</p>
        <div className="flex items-center justify-between rounded-lg border border-green/30 bg-green-light/40 px-4 py-2.5">
          <span className="text-sm font-medium text-brown">Google</span>
          <span className="text-xs text-green-dark font-medium"><span aria-hidden>✓</span> Connected</span>
        </div>
        {['Yelp', 'TripAdvisor'].map((p) => (
          <div
            key={p}
            className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-2.5"
          >
            <span className="text-sm font-medium text-text-lighter">{p}</span>
            <span className="rounded-full bg-border px-2 py-0.5 text-[10px] font-medium text-text-lighter">Soon</span>
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
          <p className="text-xs text-orange-dark mb-2 font-medium">How would you reply to this 5<span aria-hidden>★</span> review?</p>
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
          <p className="text-xs text-orange-dark font-medium mb-2 uppercase tracking-wide">AI Draft</p>
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
              <div className="w-10 h-10 rounded-full bg-orange-light flex items-center justify-center text-orange-dark font-semibold text-sm mb-4">{step.num}</div>
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
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    const container = containerRef.current
    const mockups   = mockupRefs.current.filter(Boolean) as HTMLDivElement[]
    const steps     = stepRefs.current.filter(Boolean) as HTMLDivElement[]
    const circles   = numCircleRefs.current.filter(Boolean) as HTMLDivElement[]
    const bar       = barRef.current
    if (!container || mockups.length < 3) return
    const el = container as HTMLElement

    // Initial state
    mockups.forEach((m, i) => { m.style.opacity = i === 0 ? '1' : '0' })
    steps.forEach((s, i)   => { s.style.opacity = i === 0 ? '1' : '0.35' })
    circles.forEach((c, i) => {
      c.classList.toggle('bg-orange', i === 0)
      c.classList.toggle('bg-orange-light', i !== 0)
      const span = c.querySelector('span')
      if (span) span.className = i === 0 ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-orange-dark'
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
      const rect  = el.getBoundingClientRect()
      const total = el.offsetHeight - window.innerHeight
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
  }, [reducedMotion])

  // Reduced motion: render the flat, fully-visible layout instead of scroll-scrubbed panels
  if (reducedMotion) return <MobileVersion />

  return (
    <section id="how-it-works" ref={containerRef} className="relative bg-white" style={{ height: '300vh' }}>
      <div className="sticky top-0 h-screen flex items-center" style={{ overflow: 'clip' }}>
        <div className="mx-auto max-w-5xl w-full px-6 grid grid-cols-2 gap-16 items-center">

          {/* Left: mockup panel */}
          <div className="rounded-2xl border border-border bg-cream shadow-lg overflow-hidden">
            <div className="h-0.5 w-full bg-orange/10 relative">
              <div ref={barRef} className="h-full bg-orange absolute left-0 top-0" style={{ width: '33%' }} />
            </div>
            <div className="relative min-h-72">
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  ref={el => { mockupRefs.current[i] = el }}
                  className="absolute inset-0 p-6"
                  style={{ opacity: 0 }}
                  aria-hidden={i !== 0}
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
                  <span className="text-sm font-semibold text-orange-dark">{step.num}</span>
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
