import Link from 'next/link'

const PLATFORM_LOGOS = ['Google', 'Yelp', 'TripAdvisor', 'DoorDash', 'Uber Eats', 'Grubhub']

const STEPS = [
  { num: '01', title: 'Connect your platforms', body: 'Link Google, Yelp, TripAdvisor and more in minutes. All your reviews in one unified dashboard.' },
  { num: '02', title: 'Train your voice', body: 'Write 5 sample responses. Stir learns your tone, vocabulary, and personality — forever.' },
  { num: '03', title: 'Approve and post', body: 'Stir drafts responses in your voice. Review, edit if you like, then post in one tap.' },
]

const PRICING = [
  { name: 'Free', price: '$0', period: '', highlight: false, href: '/sign-up', cta: 'Start free', features: ['3 AI-drafted responses/month', '1 platform connected', 'Basic reputation score', 'Response approval workflow'] },
  { name: 'Starter', price: '$29', period: '/mo', highlight: true, href: '/sign-up', cta: 'Start free trial', features: ['50 AI-drafted responses/month', '3 platforms connected', 'Full insights dashboard', 'Response posting', 'Voice training'] },
  { name: 'Growth', price: '$79', period: '/mo', highlight: false, href: '/sign-up', cta: 'Start free trial', features: ['Unlimited AI responses', 'All platforms', 'Competitor tracking', 'Weekly email reports', 'Priority support'] },
  { name: 'Agency', price: '$199', period: '/mo', highlight: false, href: 'mailto:hello@stirapp.io', cta: 'Contact sales', features: ['Unlimited locations', 'White-label reports', 'Dedicated account manager', 'API access', 'Custom integrations'] },
]

const TESTIMONIALS = [
  { quote: "We went from ignoring reviews to replying to every single one. Our Google rating went from 3.8 to 4.5 in 3 months.", name: 'Maria Santos', role: 'Owner, Café Paradiso', rating: 5 },
  { quote: "The AI sounds exactly like me. Customers have commented that our responses feel personal and genuine. It's wild.", name: 'James Park', role: "Owner, Park's Kitchen", rating: 5 },
  { quote: "Stir found a pattern in our delivery reviews I had never noticed. Fixed it. Our DoorDash rating jumped 0.7 stars.", name: 'Elena Moretti', role: 'Owner, Trattoria Elena', rating: 5 },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav aria-label="Main" className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-semibold text-charcoal tracking-tight">stir</span>
          <div className="hidden md:flex items-center gap-8 text-sm text-text-muted">
            <a href="#how-it-works" className="hover:text-charcoal transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-charcoal transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm font-medium text-text-muted hover:text-charcoal">Sign in</Link>
            <Link href="/sign-up" className="rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-dark transition-colors">Start free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-warm-gray pt-24 pb-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full bg-orange-light px-4 py-1.5 text-xs font-medium text-orange">
            AI-powered reputation management for restaurants
          </div>
          <h1 className="mb-6 text-5xl font-semibold text-charcoal leading-tight tracking-tight">
            Every review<br />
            <span className="text-orange">deserves a reply.</span>
          </h1>
          <p className="mb-8 text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            Stir aggregates your reviews across Google, Yelp, TripAdvisor and delivery platforms, then drafts responses in your voice — so every customer feels heard, without eating your day.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/sign-up" className="rounded-lg bg-orange px-6 py-3 text-base font-medium text-white hover:bg-orange-dark transition-colors">
              Start free — no card needed
            </Link>
            <a href="#how-it-works" className="text-sm font-medium text-text-muted hover:text-charcoal">See how it works →</a>
          </div>
          <p className="mt-6 text-xs text-text-lighter">Trusted by 500+ independent restaurants</p>
        </div>
      </section>

      {/* Platform logos */}
      <section className="border-y border-border bg-white py-12 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-8 text-sm font-medium text-text-lighter uppercase tracking-widest">All your reviews, one place</p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {PLATFORM_LOGOS.map(name => (
              <div key={name} className="text-base font-semibold text-text-muted hover:text-charcoal transition-colors">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="bg-warm-gray py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold text-charcoal mb-4">Your reputation at a glance</h2>
            <p className="text-text-muted">One unified score. Separate delivery subscore. Actionable insights. Everything you need to act fast.</p>
          </div>
          <div className="rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
            <div className="flex">
              <div className="w-48 bg-charcoal p-5 min-h-64 flex flex-col">
                <div className="text-white font-semibold mb-8 text-lg">stir</div>
                {['Dashboard', 'Reviews', 'Insights', 'Settings'].map((item, i) => (
                  <div key={item} className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-1 text-sm ${i === 0 ? 'bg-orange text-white' : 'text-white/60'}`}>
                    <span className="w-4 h-4 rounded bg-white/20 inline-block shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex-1 p-6 bg-warm-gray">
                <div className="mb-4 text-lg font-semibold text-charcoal">Good morning, The Corner Table</div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Overall Score', value: '4.3', sub: '↑ 0.2 this month' },
                    { label: 'Delivery Score', value: '3.1', sub: 'Separate from dine-in' },
                    { label: 'Awaiting Reply', value: '6', sub: 'reviews unanswered' },
                  ].map(card => (
                    <div key={card.label} className="rounded-xl bg-white border border-border p-4">
                      <p className="text-xs text-text-lighter mb-1">{card.label}</p>
                      <p className="text-2xl font-semibold text-charcoal">{card.value}</p>
                      <p className="text-xs text-text-lighter mt-0.5">{card.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-white border border-border p-4">
                  <p className="text-xs font-medium text-text-lighter mb-2">Recent review</p>
                  <p className="text-sm text-charcoal">★★★★☆ · <span className="text-text-muted">&quot;Handmade pasta was excellent. Service felt a bit rushed though.&quot;</span></p>
                  <div className="mt-2 text-xs text-orange font-medium">Draft reply →</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold text-charcoal mb-4">Up and running in 10 minutes</h2>
            <p className="text-text-muted">No long setup. No technical knowledge required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map(step => (
              <div key={step.num} className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-light flex items-center justify-center text-orange font-semibold text-sm">{step.num}</div>
                <h3 className="font-semibold text-charcoal text-lg">{step.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-warm-gray py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold text-charcoal mb-4">Simple, honest pricing</h2>
            <p className="text-text-muted">Start free. Upgrade when you&apos;re ready.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {PRICING.map(plan => (
              <div key={plan.name} className={`rounded-2xl border p-6 flex flex-col bg-white ${plan.highlight ? 'border-orange shadow-lg ring-2 ring-orange/20' : 'border-border'}`}>
                {plan.highlight && <div className="mb-3 text-xs font-medium text-orange bg-orange-light rounded-full px-3 py-1 w-fit">Most popular</div>}
                <div className="mb-1 font-semibold text-charcoal">{plan.name}</div>
                <div className="mb-5 flex items-end gap-0.5">
                  <span className="text-3xl font-semibold text-charcoal">{plan.price}</span>
                  <span className="text-text-muted text-sm mb-1">{plan.period}</span>
                </div>
                <ul className="flex flex-col gap-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-muted">
                      <span className="text-green mt-0.5 shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <a href={plan.href} className={`rounded-lg px-4 py-2.5 text-sm font-medium text-center transition-colors ${plan.highlight ? 'bg-orange text-white hover:bg-orange-dark' : 'border border-border text-charcoal hover:bg-warm-gray'}`}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold text-charcoal mb-4">Restaurants that made the switch</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="rounded-2xl border border-border p-6 bg-warm-gray">
                <div className="mb-4 text-orange text-sm">{'★'.repeat(t.rating)}</div>
                <p className="text-charcoal text-sm leading-relaxed mb-4">&quot;{t.quote}&quot;</p>
                <div>
                  <p className="font-medium text-charcoal text-sm">{t.name}</p>
                  <p className="text-xs text-text-muted">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-charcoal py-24 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-white mb-4">Start managing your reputation today</h2>
          <p className="text-white/70 mb-8 leading-relaxed">Join 500+ restaurants replying to every review — without hiring a marketing manager.</p>
          <Link href="/sign-up" className="inline-block rounded-lg bg-orange px-8 py-3.5 text-base font-medium text-white hover:bg-orange-dark transition-colors">
            Get started free
          </Link>
          <p className="mt-4 text-xs text-white/40">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-8 px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-sm text-text-lighter">
          <span className="font-semibold text-charcoal">stir</span>
          <span>© 2026 Stir. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-charcoal">Privacy</a>
            <a href="/terms" className="hover:text-charcoal">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
