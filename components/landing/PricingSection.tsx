'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

const PRICING = [
  { name: 'Free', price: '$0', period: '', highlight: false, href: '/sign-up', cta: 'Start free', features: ['3 AI-drafted responses/month', '1 platform connected', 'Basic reputation score', 'Response approval workflow'] },
  { name: 'Starter', price: '$29', period: '/mo', highlight: true, href: '/sign-up', cta: 'Start free trial', features: ['50 AI-drafted responses/month', '3 platforms connected', 'Full insights dashboard', 'Response posting', 'Voice training'] },
  { name: 'Growth', price: '$79', period: '/mo', highlight: false, href: '/sign-up', cta: 'Start free trial', features: ['Unlimited AI responses', 'All platforms', 'Competitor tracking', 'Weekly email reports', 'Priority support'] },
  { name: 'Agency', price: '$199', period: '/mo', highlight: false, href: 'mailto:hello@stirapp.io', cta: 'Contact sales', features: ['Unlimited locations', 'White-label reports', 'Dedicated account manager', 'API access', 'Custom integrations'] },
]

export function PricingSection() {
  return (
    <section id="pricing" className="bg-cream py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-semibold text-brown mb-4">Simple, honest pricing</h2>
          <p className="text-text-muted">Start free. Upgrade when you&apos;re ready.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {PRICING.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              whileHover={{ y: plan.highlight ? -6 : -3 }}
              className={`rounded-2xl border p-6 flex flex-col bg-white ${plan.highlight ? 'border-orange shadow-lg shadow-orange/10 ring-2 ring-orange/20' : 'border-border shadow-sm'}`}
            >
              {plan.highlight && <div className="mb-3 text-xs font-medium text-orange-dark bg-orange-light rounded-full px-3 py-1 w-fit">Most popular</div>}
              <div className="mb-1 font-semibold text-brown">{plan.name}</div>
              <div className="mb-5 flex items-end gap-0.5">
                <span className="text-3xl font-semibold text-brown">{plan.price}</span>
                <span className="text-text-muted text-sm mb-1">{plan.period}</span>
              </div>
              <ul className="flex flex-col gap-2 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-muted">
                    <span className="text-green-dark mt-0.5 shrink-0" aria-hidden>✓</span>{f}
                  </li>
                ))}
              </ul>
              {plan.href.startsWith('mailto:') ? (
                <a href={plan.href} className={`rounded-lg px-4 py-2.5 text-sm font-medium text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 ${plan.highlight ? 'bg-orange text-white hover:bg-orange-dark' : 'border border-border text-brown hover:bg-cream'}`}>
                  {plan.cta}
                </a>
              ) : (
                <Link href={plan.href} className={`rounded-lg px-4 py-2.5 text-sm font-medium text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 ${plan.highlight ? 'bg-orange text-white hover:bg-orange-dark' : 'border border-border text-brown hover:bg-cream'}`}>
                  {plan.cta}
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
