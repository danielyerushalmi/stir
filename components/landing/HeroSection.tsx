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
    const badge = badgeRef.current
    const sub   = subRef.current
    const cta   = ctaRef.current
    const trust = trustRef.current
    const image = imageRef.current
    const card1 = card1Ref.current
    const card2 = card2Ref.current

    if (!badge || !sub || !cta || !trust || !image) return

    const tl = createTimeline({ defaults: { ease: 'outExpo' } })
    tl
      .add(badge, { opacity: [0, 1], y: [-8, 0], duration: 500 })
      .add(words, { opacity: [0, 1], y: [20, 0], duration: 400, delay: stagger(80) }, '-=300')
      .add(sub,   { opacity: [0, 1], duration: 500 }, '-=300')
      .add(cta,   { opacity: [0, 1], y: [8, 0], duration: 400 }, '-=200')
      .add(trust, { opacity: [0, 1], duration: 400 }, '-=200')
      .add(image, { opacity: [0, 1], y: [20, 0], duration: 700, ease: 'out(3)' }, 300)

    if (card1) tl.add(card1, { opacity: [0, 1], y: [10, 0], duration: 500 }, '-=200')
    if (card2) tl.add(card2, { opacity: [0, 1], y: [-10, 0], duration: 500 }, '-=400')

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
              className="mb-6 inline-flex items-center rounded-full bg-orange-light px-4 py-1.5 text-xs font-medium text-orange-dark cursor-default"
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
              Stir pulls your Google reviews into one dashboard — Yelp, TripAdvisor and delivery platforms coming soon — and drafts responses in your voice so every customer feels heard, without eating your day.
            </p>

            <div ref={ctaRef} style={{ opacity: 0 }} className="flex items-center gap-4 flex-wrap mb-10">
              <motion.div
                className="inline-block"
                whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                whileTap={{ y: 1, scale: 0.97, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              >
                <Link
                  href="/sign-up"
                  className="block rounded-lg bg-orange px-6 py-3 text-base font-medium text-white hover:bg-orange-dark transition-colors shadow-lg shadow-orange/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
                >
                  Start free, no card needed
                </Link>
              </motion.div>
              <a href="#how-it-works" className="rounded text-sm font-medium text-text-muted hover:text-brown transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2">
                See how it works <span aria-hidden>↓</span>
              </a>
            </div>

            <p ref={trustRef} style={{ opacity: 0 }} className="text-xs text-text-lighter">
              Built for independent restaurants
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
                  <span className="text-xs text-orange" role="img" aria-label="5 out of 5 stars">
                    <span aria-hidden>★★★★★</span>
                  </span>
                </div>
                <p className="text-xs text-brown line-clamp-2 leading-relaxed">Best Italian in town. The carbonara is life-changing.</p>
              </motion.div>

              <motion.div
                ref={card2Ref}
                style={{ opacity: 0 }}
                whileHover={{ scale: 1.04, y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                className="absolute top-5 right-5 z-10 w-52 rounded-xl border border-red-dark/30 bg-red-light p-3.5 shadow-xl hidden lg:block cursor-default"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-red-dark">Google · James T.</span>
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
