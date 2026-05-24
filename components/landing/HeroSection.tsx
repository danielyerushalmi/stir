'use client'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

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
    <section className="grain relative bg-cream overflow-hidden pt-20 pb-16 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: text content */}
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.03, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              className="mb-6 inline-flex items-center rounded-full bg-orange-light px-4 py-1.5 text-xs font-medium text-orange cursor-default"
            >
              AI-powered reputation management for restaurants
            </motion.div>

            <motion.h1
              className="mb-6 font-semibold text-brown leading-tight tracking-tight"
              style={{ fontSize: 'clamp(2.75rem, 5vw + 0.5rem, 4.5rem)' }}
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
              className="mb-8 text-lg text-text-muted max-w-xl leading-relaxed"
            >
              Stir aggregates your reviews across Google, Yelp, TripAdvisor and delivery platforms, then drafts responses in your voice so every customer feels heard, without eating your day.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="flex items-center gap-4 flex-wrap mb-10"
            >
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
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="text-xs text-text-lighter"
            >
              Trusted by 500+ independent restaurants
            </motion.p>
          </div>

          {/* Right: photo + floating review cards */}
          <div className="relative">
            {/* Outer wrapper: provides shadow + relative anchor for floating cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-[4/3] lg:aspect-[4/5] rounded-2xl shadow-2xl"
            >
              {/* Inner clip: rounds image corners without clipping shadow or cards */}
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

              {/* 5★ review card — bottom left */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5, ease: 'easeOut' }}
                whileHover={{ scale: 1.04, y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                className="absolute bottom-5 left-5 z-10 w-52 rounded-xl border border-green/20 bg-white p-3.5 shadow-xl hidden lg:block cursor-default"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-text-muted">Google · Sarah M.</span>
                  <span className="text-xs text-orange">★★★★★</span>
                </div>
                <p className="text-xs text-brown line-clamp-2 leading-relaxed">Best Italian in town. The carbonara is life-changing.</p>
              </motion.div>

              {/* 1★ no reply card — top right */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.5, ease: 'easeOut' }}
                whileHover={{ scale: 1.04, y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                className="absolute top-5 right-5 z-10 w-52 rounded-xl border border-red-light bg-red-light p-3.5 shadow-xl hidden lg:block cursor-default"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-red-dark">Yelp · James T.</span>
                  <span className="rounded-full bg-white text-red-dark text-xs font-medium px-2 py-0.5">No reply</span>
                </div>
                <p className="text-xs text-brown line-clamp-2 leading-relaxed">Service was slow. The risotto arrived cold. Disappointing.</p>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
