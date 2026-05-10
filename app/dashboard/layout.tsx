import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { PageTransition } from '@/components/dashboard/PageTransition'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-cream overflow-y-auto">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}
