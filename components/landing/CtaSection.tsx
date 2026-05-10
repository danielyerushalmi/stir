'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { StirLogo } from '@/components/logo/StirLogo'

export function CtaSection() {
  return (
    <>
      <section className="relative bg-brown py-24 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(232,99,10,0.15) 0%, transparent 70%)' }}
        />
        <div className="mx-auto max-w-2xl text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-semibold text-white mb-4"
          >
            Start managing your reputation today
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-white/70 mb-8 leading-relaxed"
          >
            Join 500+ restaurants replying to every review — without hiring a marketing manager.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(232,99,10,0)', '0 0 0 8px rgba(232,99,10,0.15)', '0 0 0 0 rgba(232,99,10,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="inline-block rounded-lg"
            >
              <Link href="/sign-up" className="inline-block rounded-lg bg-orange px-8 py-3.5 text-base font-medium text-white hover:bg-orange-dark transition-colors">
                Get started free
              </Link>
            </motion.div>
          </motion.div>
          <p className="mt-4 text-xs text-white/40">No credit card required · Cancel anytime</p>
        </div>
      </section>

      <footer className="border-t border-border bg-white py-8 px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-sm text-text-lighter flex-wrap gap-4">
          <StirLogo size="sm" />
          <span>© 2026 Stir. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-brown transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-brown transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </>
  )
}
