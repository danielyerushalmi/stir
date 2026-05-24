'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', icon: '◻', label: 'Home' },
  { href: '/dashboard/reviews', icon: '★', label: 'Reviews' },
  { href: '/dashboard/insights', icon: '◎', label: 'Insights' },
  { href: '/dashboard/settings', icon: '⚙', label: 'Settings' },
]

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-brown border-t border-white/10">
      <div className="flex items-center justify-around px-1 py-1">
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs transition-colors min-w-[56px]',
                active ? 'text-orange' : 'text-white/60 hover:text-white'
              )}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
