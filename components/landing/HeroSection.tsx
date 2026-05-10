'use client'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'

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
              {w === 'reply.' ? <span className="text-orange">reply.</span> : w}
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
