import { SignUp } from '@clerk/nextjs'
import { StirLogo } from '@/components/logo/StirLogo'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-6">
      <StirLogo size="lg" />
      <SignUp fallbackRedirectUrl="/onboarding" />
    </div>
  )
}
