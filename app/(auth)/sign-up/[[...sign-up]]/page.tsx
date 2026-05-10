import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-warm-gray flex items-center justify-center">
      <SignUp fallbackRedirectUrl="/onboarding" />
    </div>
  )
}
