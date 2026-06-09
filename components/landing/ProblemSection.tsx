'use client'
import { useRef, useEffect } from 'react'
import { useReducedMotion } from 'framer-motion'
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
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    const container = containerRef.current
    const panels    = panelRefs.current.filter(Boolean) as HTMLDivElement[]
    const dots      = dotRefs.current.filter(Boolean) as HTMLDivElement[]
    if (!container || panels.length < 3 || dots.length < 3) return
    const el = container as HTMLElement

    const labels = labelRefs.current.filter(Boolean) as HTMLSpanElement[]

    // Set initial state: only panel 0 visible
    panels.forEach((p, i) => { p.style.opacity = i === 0 ? '1' : '0' })
    dots.forEach((d, i)   => { d.style.opacity = i === 0 ? '1' : '0.2'; d.style.scale = i === 0 ? '1.6' : '1' })
    labels.forEach((l, i) => { l.style.opacity = i === 0 ? '1' : '0' })

    // Timeline: 0–1000ms maps to 0%–100% scroll progress
    const tl = createTimeline({ autoplay: false, defaults: { ease: 'linear', duration: 80 } })

    // At 33% progress: crossfade to panel 1
    tl
      .add(panels[0],  { opacity: 0 }, 300)
      .add(panels[1],  { opacity: 1 }, 300)
      .add(dots[0],    { opacity: 0.2, scale: 1 }, 300)
      .add(dots[1],    { opacity: 1,   scale: 1.6 }, 300)
      .add(labels[0],  { opacity: 0 }, 300)
      .add(labels[1],  { opacity: 1 }, 300)
      // At 66% progress: crossfade to panel 2
      .add(panels[1],  { opacity: 0 }, 630)
      .add(panels[2],  { opacity: 1 }, 630)
      .add(dots[1],    { opacity: 0.2, scale: 1 }, 630)
      .add(dots[2],    { opacity: 1,   scale: 1.6 }, 630)
      .add(labels[1],  { opacity: 0 }, 630)
      .add(labels[2],  { opacity: 1 }, 630)

    let raf = 0
    function update() {
      const rect  = el.getBoundingClientRect()
      const total = el.offsetHeight - window.innerHeight
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
  }, [reducedMotion])

  // Reduced motion: render the flat, fully-visible layout instead of scroll-scrubbed panels
  if (reducedMotion) return <MobileVersion />

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
                    className="absolute inset-0 text-sm font-medium text-orange-dark whitespace-nowrap"
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
                aria-hidden={i !== 0}
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
