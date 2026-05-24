'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { StirLogo } from '@/components/logo/StirLogo'

const NAV = [
  { href: '/dashboard', icon: '◻', label: 'Dashboard' },
  { href: '/dashboard/reviews', icon: '★', label: 'Reviews' },
  { href: '/dashboard/insights', icon: '◎', label: 'Insights' },
  { href: '/dashboard/settings', icon: '⚙', label: 'Settings' },
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
          {collapsed ? '›' : '‹'}
        </button>
      </div>
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} aria-current={active ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors', active ? 'bg-orange text-white shadow-sm' : 'text-white/70 hover:bg-brown-mid/50 hover:text-white')}>
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
