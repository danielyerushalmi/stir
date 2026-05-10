import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stir — Restaurant Reputation Management',
  description: 'AI-powered review management for restaurants',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
