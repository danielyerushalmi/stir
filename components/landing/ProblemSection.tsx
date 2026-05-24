'use client'
import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useReducedMotion, MotionValue, animate, useInView, useMotionValue } from 'framer-motion'

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const rounded = useTransform(count, Math.round)

  useEffect(() => {
    if (isInView) animate(count, to, { duration: 1.5, ease: [0.16, 1, 0.3, 1] })
  }, [isInView, count, to])

  return <motion.span ref={ref}>{rounded}</motion.span>
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

function StepDot({ index, activeStep }: { index: number; activeStep: MotionValue<number> }) {
  const scale = useTransform(activeStep, (v: number) =>
    1 + Math.max(0, 1 - Math.abs(v - index)) * 0.6
  )
  const opacity = useTransform(activeStep, (v: number) =>
    0.2 + Math.max(0, 1 - Math.abs(v - index)) * 0.8
  )
  return (
    <motion.div
      className="w-2 h-2 rounded-full bg-orange"
      style={{ scale, opacity }}
    />
  )
}

function StepDotLabel({ label, index, activeStep }: { label: string; index: number; activeStep: MotionValue<number> }) {
  const opacity = useTransform(activeStep, (v: number) =>
    Math.max(0, 1 - Math.abs(v - index))
  )
  return (
    <motion.span
      className="absolute inset-0 text-sm font-medium text-orange whitespace-nowrap"
      style={{ opacity }}
    >
      {label}
    </motion.span>
  )
}

function StepIndicator({ activeStep }: { activeStep: MotionValue<number> }) {
  return (
    <div className="mt-10 flex items-center gap-3">
      <div className="flex items-center gap-2.5">
        {PAIN_POINTS.map((_, i) => (
          <StepDot key={i} index={i} activeStep={activeStep} />
        ))}
      </div>
      <div className="relative h-5 min-w-[160px]">
        {PAIN_POINTS.map((p, i) => (
          <StepDotLabel key={p.id} label={p.label} index={i} activeStep={activeStep} />
        ))}
      </div>
    </div>
  )
}

export function ProblemSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const activeStepRaw = useTransform(scrollYProgress, [0, 0.33, 0.66, 1], [0, 1, 2, 2])

  if (prefersReduced) {
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

  return (
    <>
      <div className="md:hidden">
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
      </div>

      <div className="hidden md:block">
        <section ref={containerRef} className="relative bg-cream-dark" style={{ height: '300vh' }}>
          <div className="sticky top-0 h-screen flex items-center overflow-hidden">
            <div className="mx-auto max-w-5xl w-full px-6 grid grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-semibold text-brown leading-snug">
                  Your reviews are talking.<br />
                  <span className="text-orange">Are you listening?</span>
                </h2>
                <p className="mt-4 text-text-muted text-base leading-relaxed">
                  Every unanswered review is a missed chance to win back a customer — or convert a reader into a guest.
                </p>
                <StepIndicator activeStep={activeStepRaw} />
              </div>
              <div className="relative h-64">
                {PAIN_POINTS.map((point, i) => (
                  <ActivePainPoint key={point.id} point={point} index={i} activeStepRaw={activeStepRaw} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

function ActivePainPoint({
  point,
  index,
  activeStepRaw,
}: {
  point: { id: string; content: React.ReactNode }
  index: number
  activeStepRaw: MotionValue<number>
}) {
  const opacity = useTransform(activeStepRaw, (v: number) =>
    Math.max(0, 1 - Math.abs(v - index))
  )
  const y = useTransform(activeStepRaw, (v: number) =>
    (v - index) * 24
  )
  const scale = useTransform(activeStepRaw, (v: number) =>
    0.94 + Math.max(0, 1 - Math.abs(v - index)) * 0.06
  )

  return (
    <motion.div className="absolute inset-0" style={{ opacity, y, scale }}>
      {point.content}
    </motion.div>
  )
}
