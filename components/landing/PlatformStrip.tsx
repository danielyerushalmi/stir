'use client'

// Only Google is a live integration today — everything else must show "Soon"
// so the landing page never claims more than Settings can deliver.
const PLATFORMS: { name: string; live: boolean }[] = [
  { name: 'Google',      live: true },
  { name: 'Yelp',        live: false },
  { name: 'TripAdvisor', live: false },
  { name: 'DoorDash',    live: false },
  { name: 'Uber Eats',   live: false },
  { name: 'Grubhub',     live: false },
]

const DOT = <span className="mx-8 text-border select-none" aria-hidden>·</span>

function PlatformItem({ name, live }: { name: string; live: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 shrink-0">
      <span className={live ? 'text-sm font-semibold text-text-muted' : 'text-sm font-semibold text-text-lighter/50'}>
        {name}
      </span>
      {!live && (
        <span className="rounded-full bg-border px-2 py-0.5 text-[10px] font-medium text-text-lighter">
          Soon
        </span>
      )}
    </span>
  )
}

export function PlatformStrip() {
  const items = PLATFORMS.flatMap((p, i) => [
    <PlatformItem key={`a-${i}`} {...p} />,
    <span key={`da-${i}`} aria-hidden>{DOT}</span>,
  ])

  // Duplicate for seamless loop — the copy is aria-hidden so screen readers
  // hear each platform once, not twice.
  const band = [
    ...items,
    <span key="dup" aria-hidden="true" className="contents">
      {items.map((el) =>
        el.key ? { ...el, key: String(el.key).replace('a-', 'b-').replace('da-', 'db-') } : el
      )}
    </span>,
  ]

  return (
    <section className="border-y border-border bg-white py-10 overflow-hidden" aria-label="Supported platforms">
      <p className="mb-6 text-center text-xs font-medium text-text-lighter uppercase tracking-widest">
        All your reviews, one place
      </p>
      <div
        className="flex whitespace-nowrap"
        style={{
          animation: 'ticker 28s linear infinite',
          willChange: 'transform',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'paused')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'running')}
      >
        {band}
      </div>
    </section>
  )
}
