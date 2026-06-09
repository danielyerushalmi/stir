'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = ['Reviews', 'Score', 'Insights'] as const
type Tab = typeof TABS[number]

const FAKE_REVIEWS = [
  { id: '1', platform: 'Google', rating: 5, author: 'Sarah M.', text: 'Best Italian in Austin. The carbonara is life-changing.', platformBg: 'bg-blue-50', platformText: 'text-blue-600' },
  { id: '2', platform: 'Yelp', rating: 2, author: 'James T.', text: 'Service was slow and my risotto arrived cold. Disappointing.', platformBg: 'bg-red-50', platformText: 'text-red-600' },
  { id: '3', platform: 'TripAdvisor', rating: 4, author: 'Anna W.', text: 'Lovely atmosphere and homemade pasta. Will be back soon.', platformBg: 'bg-green-light', platformText: 'text-green-dark' },
]

const FAKE_DRAFT = "So glad you came in, Sarah! The carbonara is Marco's recipe — he's been perfecting it for 20 years. See you again soon!"

function ReviewsTab() {
  const [draftFor, setDraftFor] = useState<string | null>(null)
  const [typing, setTyping] = useState(false)
  const [showDraft, setShowDraft] = useState<string | null>(null)
  const [posted, setPosted] = useState<Set<string>>(new Set())

  function handleDraft(id: string) {
    if (posted.has(id)) return
    setDraftFor(id)
    setTyping(true)
    setTimeout(() => { setTyping(false); setShowDraft(id) }, 1200)
  }

  return (
    <div className="space-y-3">
      {FAKE_REVIEWS.map(r => (
        <div key={r.id}>
          <div className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${r.platformBg} ${r.platformText}`}>{r.platform}</span>
                  <span className="text-xs" role="img" aria-label={`${r.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={i < r.rating ? 'text-orange' : 'text-border'} aria-hidden>★</span>
                    ))}
                  </span>
                </div>
                <p className="text-sm text-brown line-clamp-1">{r.text}</p>
              </div>
              <div className="shrink-0">
                {posted.has(r.id) ? (
                  <span className="text-xs text-green-dark font-medium"><span aria-hidden>✓</span> Replied</span>
                ) : showDraft === r.id ? (
                  <span className="text-xs text-orange-dark font-medium">Draft ready</span>
                ) : (
                  <button
                    onClick={() => handleDraft(r.id)}
                    className="rounded-lg bg-orange text-white text-xs font-medium px-3 py-1.5 hover:bg-orange-dark transition-colors"
                  >
                    Draft reply →
                  </button>
                )}
              </div>
            </div>
          </div>
          <AnimatePresence>
            {draftFor === r.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 ml-4 overflow-hidden"
              >
                <div className="rounded-xl border-l-4 border-l-orange border border-orange/20 bg-orange-light p-4">
                  <p className="text-xs font-medium text-orange-dark uppercase tracking-wide mb-2">AI Draft</p>
                  {typing ? (
                    <div className="flex gap-1 py-1">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-2 h-2 rounded-full bg-orange"
                          animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} />
                      ))}
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="text-sm text-brown mb-3">{FAKE_DRAFT}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setPosted(p => new Set(p).add(r.id)); setDraftFor(null); setShowDraft(null) }}
                          className="rounded-lg bg-orange text-white text-xs font-medium px-3 py-1.5 hover:bg-orange-dark transition-colors"
                        >
                          Approve &amp; Post
                        </button>
                        <button
                          onClick={() => { setDraftFor(null); setShowDraft(null) }}
                          className="rounded-lg border border-border text-xs font-medium px-3 py-1.5 text-brown hover:bg-cream transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

function ScoreTab() {
  const [started, setStarted] = useState(false)
  const [score, setScore] = useState(3.2)

  function animateScore() {
    setStarted(true)
    const target = 4.3
    const startTime = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - startTime) / 1500, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setScore(Math.round((3.2 + eased * (target - 3.2)) * 10) / 10)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  return (
    <div className="text-center py-6">
      <p className="text-xs text-text-lighter uppercase tracking-wide mb-6">Overall reputation score</p>
      <motion.div
        className="text-7xl font-semibold text-green mb-2"
        animate={{ scale: started ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 0.4 }}
      >
        {score.toFixed(1)}
      </motion.div>
      <div className="flex items-center justify-center gap-1 mb-2">
        <motion.span animate={{ opacity: started ? 1 : 0 }} className="text-green-dark text-sm font-medium"><span aria-hidden>↑</span> 1.1</motion.span>
        <span className="text-xs text-text-lighter">vs last month</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="rounded-lg bg-cream-dark p-3">
          <p className="text-xs text-text-lighter mb-1">Delivery Score</p>
          <p className="text-xl font-semibold text-amber-dark">3.1</p>
        </div>
        <div className="rounded-lg bg-cream-dark p-3">
          <p className="text-xs text-text-lighter mb-1">Awaiting Reply</p>
          <p className="text-xl font-semibold text-brown">6</p>
        </div>
      </div>
      {!started && (
        <button onClick={animateScore} className="mt-6 rounded-lg bg-orange text-white text-sm font-medium px-4 py-2 hover:bg-orange-dark transition-colors">
          Watch score improve →
        </button>
      )}
    </div>
  )
}

const INSIGHTS = [
  { id: '1', type: 'ALERT', title: 'Slow service complaints up 40%', body: 'Wait time mentions in negative reviews have increased significantly over the last 30 days.', badgeBg: 'bg-red-light', badgeText: 'text-red-dark' },
  { id: '2', type: 'TIP', title: 'Delivery packaging needs improvement', body: '3 of your last 5 delivery reviews mention spills or cold food on arrival.', badgeBg: 'bg-amber-light', badgeText: 'text-amber-dark' },
  { id: '3', type: 'TIP', title: 'Tiramisu is your #1 mentioned dish', body: 'Customers rave about it in 12 recent reviews. Feature it more prominently.', badgeBg: 'bg-green-light', badgeText: 'text-green-dark' },
]

function InsightsTab() {
  const [readIds, setReadIds] = useState<string[]>([])

  return (
    <div className="space-y-3">
      {INSIGHTS.map((insight, i) => (
        <motion.div
          key={insight.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: readIds.includes(insight.id) ? 0.5 : 1, x: 0 }}
          transition={{ delay: i * 0.1, duration: 0.35 }}
          className="rounded-xl border border-border bg-white p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${insight.badgeBg} ${insight.badgeText}`}>{insight.type}</span>
              </div>
              <p className="text-sm font-semibold text-brown mb-0.5">{insight.title}</p>
              <p className="text-xs text-text-muted">{insight.body}</p>
            </div>
            {!readIds.includes(insight.id) && (
              <button onClick={() => setReadIds(p => [...p, insight.id])} className="text-xs text-text-lighter hover:text-orange shrink-0 transition-colors">
                Mark read
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function DemoWidget() {
  const [activeTab, setActiveTab] = useState<Tab>('Reviews')

  return (
    <section className="bg-cream-dark py-24 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-brown mb-4">Try it yourself</h2>
          <p className="text-text-muted">Click through a real demo — no sign-up needed.</p>
        </div>

        <div className="rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
          {/* Mock browser chrome */}
          <div className="flex items-center gap-2 border-b border-border bg-cream px-4 py-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-light" />
              <div className="w-3 h-3 rounded-full bg-amber-light" />
              <div className="w-3 h-3 rounded-full bg-green-light" />
            </div>
            <div className="flex-1 text-center text-xs text-text-lighter">app.stirapp.io/dashboard</div>
          </div>

          <div className="flex">
            {/* Mock sidebar */}
            <div className="w-44 bg-brown p-4 hidden md:flex flex-col min-h-80">
              <div className="text-white font-semibold mb-6 text-sm">stir</div>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-1 text-sm text-left transition-colors ${activeTab === tab ? 'bg-orange text-white' : 'text-white/60 hover:bg-brown-mid/50 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 min-h-80">
              {/* Mobile tabs */}
              <div className="flex gap-1 md:hidden mb-6 bg-cream rounded-lg p-1">
                {TABS.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white text-brown shadow-sm' : 'text-text-muted'}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'Reviews' && <ReviewsTab />}
                  {activeTab === 'Score' && <ScoreTab />}
                  {activeTab === 'Insights' && <InsightsTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
