import { StirLogo } from '@/components/logo/StirLogo'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-warm-gray flex flex-col items-center justify-center p-6">
      <div className="mb-8"><StirLogo size="sm" /></div>
      {children}
    </div>
  )
}
