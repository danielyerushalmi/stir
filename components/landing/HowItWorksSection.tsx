'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion, MotionValue } from 'framer-motion'

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
          <p className="text-sm text-brown italic mb-3">&quot;Best meal we&apos;ve had in years. Pasta was incredible.&quot;</p>
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

function StepMockup({ activeStep, index }: { activeStep: MotionValue<number>; index: number }) {
  const opacity = useTransform(activeStep, (v: number) =>
    Math.max(0, 1 - Math.abs(v - index))
  )
  const y = useTransform(activeStep, (v: number) =>
    (v - index) * 20
  )
  return (
    <motion.div className="absolute inset-0 p-6" style={{ opacity, y }}>
      {STEPS[index].mockup}
    </motion.div>
  )
}

function MockupContainer({
  activeStep,
  scrollYProgress,
}: {
  activeStep: MotionValue<number>
  scrollYProgress: MotionValue<number>
}) {
  const barWidth = useTransform(
    scrollYProgress,
    [0, 0.4, 0.7, 1],
    ['33%', '66%', '100%', '100%']
  )

  return (
    <div className="rounded-2xl border border-border bg-cream shadow-lg relative overflow-hidden">
      <div className="h-0.5 w-full bg-orange/10">
        <motion.div className="h-full bg-orange" style={{ width: barWidth }} />
      </div>
      <div className="relative min-h-48">
        {STEPS.map((_, i) => (
          <StepMockup key={i} activeStep={activeStep} index={i} />
        ))}
      </div>
    </div>
  )
}

function StepCard({
  step,
  index,
  activeStep,
}: {
  step: typeof STEPS[0]
  index: number
  activeStep: MotionValue<number>
}) {
  const opacity = useTransform(activeStep, (v: number) =>
    0.35 + Math.max(0, 1 - Math.abs(v - index)) * 0.65
  )
  const scale = useTransform(activeStep, (v: number) =>
    0.97 + Math.max(0, 1 - Math.abs(v - index)) * 0.03
  )
  const circleActive = useTransform(activeStep, (v: number) =>
    Math.max(0, 1 - Math.abs(v - index))
  )
  const circleInactive = useTransform(activeStep, (v: number) =>
    1 - Math.max(0, 1 - Math.abs(v - index))
  )

  return (
    <motion.div
      className="flex gap-4"
      style={{ opacity, scale }}
      whileHover={{ x: 4, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
    >
      <div className="w-10 h-10 shrink-0 relative">
        <motion.div
          className="absolute inset-0 rounded-full bg-orange-light flex items-center justify-center"
          style={{ opacity: circleInactive }}
        >
          <span className="text-sm font-semibold text-orange">{step.num}</span>
        </motion.div>
        <motion.div
          className="absolute inset-0 rounded-full bg-orange flex items-center justify-center"
          style={{ opacity: circleActive }}
        >
          <span className="text-sm font-semibold text-white">{step.num}</span>
        </motion.div>
      </div>
      <div>
        <h3 className="font-semibold text-brown mb-1">{step.title}</h3>
        <p className="text-text-muted text-base leading-relaxed">{step.body}</p>
      </div>
    </motion.div>
  )
}

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

  return (
    <section id="how-it-works" ref={containerRef} className="relative bg-white" style={{ height: '300vh' }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="mx-auto max-w-5xl w-full px-6 grid grid-cols-2 gap-16 items-center">
          <MockupContainer activeStep={activeStep} scrollYProgress={scrollYProgress} />

          <div className="flex flex-col gap-8">
            <h2 className="text-3xl font-semibold text-brown">Up and running in 10 minutes</h2>
            {STEPS.map((step, i) => (
              <StepCard key={step.num} step={step} index={i} activeStep={activeStep} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
