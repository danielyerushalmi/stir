'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { StirLogo } from '@/components/logo/StirLogo'

const DashboardIcon = () => <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
const ReviewsIcon = () => <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
const InsightsIcon = () => <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
const SettingsIcon = () => <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>

const NAV = [
  { href: '/dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
  { href: '/dashboard/reviews', icon: <ReviewsIcon />, label: 'Reviews' },
  { href: '/dashboard/insights', icon: <InsightsIcon />, label: 'Insights' },
  { href: '/dashboard/settings', icon: <SettingsIcon />, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setCollapsed(saved === 'true')
  }, [])

  function toggleCollapsed() {
    setCollapsed(c => {
      const next = !c
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <aside className={cn('hidden md:flex flex-col bg-brown text-white transition-all duration-200 min-h-screen', collapsed ? 'w-16' : 'w-56')}>
      <div className="flex items-center justify-between px-4 py-5">
        {!collapsed && <StirLogo variant="white" size="sm" />}
        <button onClick={toggleCollapsed} className="ml-auto rounded p-1 hover:bg-brown-mid/50 text-white/60 hover:text-white transition-colors" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <span aria-hidden="true">{collapsed ? '›' : '‹'}</span>
        </button>
      </div>
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} aria-current={active ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors', active ? 'bg-orange text-white shadow-sm' : 'text-white/70 hover:bg-brown-mid/50 hover:text-white')}>
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
