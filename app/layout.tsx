import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Figtree } from 'next/font/google'
import './globals.css'

const figtree = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-figtree',
})

export const metadata: Metadata = {
  title: 'Stir — Restaurant Reputation Management',
  description: 'AI-powered review management for restaurants',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider signInFallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/onboarding">
      <html lang="en">
        <body className={`${figtree.variable} ${figtree.className}`}>{children}</body>
      </html>
    </ClerkProvider>
  )
}
