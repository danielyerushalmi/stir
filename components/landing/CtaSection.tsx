'use client'
import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import Link from 'next/link'
import { StirLogo } from '@/components/logo/StirLogo'

function PulsingCta() {
  const wrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = wrapRef.current
    if (!el) return
    animate(el, {
      boxShadow: [
        '0 0 0 0px rgba(232,99,10,0)',
        '0 0 0 10px rgba(232,99,10,0.15)',
        '0 0 0 0px rgba(232,99,10,0)',
      ],
      duration: 2500,
      ease: 'inOutSine',
      loop: true,
    })
    return () => {}
  }, [])
  return (
    <div ref={wrapRef} className="inline-block rounded-lg">
      <Link href="/sign-up" className="inline-block rounded-lg bg-orange px-8 py-3.5 text-base font-medium text-white hover:bg-orange-dark transition-colors">
        Get started free
      </Link>
    </div>
  )
}

export function CtaSection() {
  return (
    <>
      <section className="relative bg-brown py-24 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(232,99,10,0.15) 0%, transparent 70%)' }}
        />
        <div className="mx-auto max-w-2xl text-center relative z-10">
          <h2 className="text-3xl font-semibold text-white mb-4">
            Start managing your reputation today
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            Join 500+ restaurants replying to every review — without hiring a marketing manager.
          </p>
          <PulsingCta />
          <p className="mt-4 text-xs text-white/40">No credit card required · Cancel anytime</p>
        </div>
      </section>

      <footer className="border-t border-border bg-white py-8 px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-sm text-text-lighter flex-wrap gap-4">
          <StirLogo size="sm" />
          <span>© 2026 Stir. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-brown transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-brown transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
