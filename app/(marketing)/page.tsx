import { HeroSection } from '@/components/landing/HeroSection'
import { ProblemSection } from '@/components/landing/ProblemSection'
import { PlatformStrip } from '@/components/landing/PlatformStrip'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { DemoWidget } from '@/components/landing/DemoWidget'
import { PricingSection } from '@/components/landing/PricingSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { CtaSection } from '@/components/landing/CtaSection'
import Link from 'next/link'
import { StirLogo } from '@/components/logo/StirLogo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Nav */}
      <nav aria-label="Main" className="sticky top-0 z-50 border-b border-border bg-cream/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <StirLogo size="sm" />
          <div className="hidden md:flex items-center gap-8 text-sm text-text-muted">
            <a href="#how-it-works" className="hover:text-brown transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-brown transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm font-medium text-text-muted hover:text-brown transition-colors">Sign in</Link>
            <Link href="/sign-up" className="rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-dark transition-colors">Start free</Link>
          </div>
        </div>
      </nav>

      <HeroSection />
      <PlatformStrip />
      <ProblemSection />
      <HowItWorksSection />
      <DemoWidget />
      <PricingSection />
      <TestimonialsSection />
      <CtaSection />
    </div>
  )
}
