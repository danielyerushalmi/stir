'use client'
import { motion } from 'framer-motion'

const PLATFORMS = ['Google', 'Yelp', 'TripAdvisor', 'DoorDash', 'Uber Eats', 'Grubhub']

export function PlatformStrip() {
  return (
    <section className="border-y border-border bg-white py-12 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-8 text-sm font-medium text-text-lighter uppercase tracking-widest">All your reviews, one place</p>
        <div className="flex flex-wrap items-center justify-center gap-10">
          {PLATFORMS.map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              className="text-base font-semibold text-text-muted hover:text-brown transition-colors cursor-default"
            >
              {name}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
