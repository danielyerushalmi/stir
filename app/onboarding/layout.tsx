export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-warm-gray flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-2xl font-semibold text-charcoal">stir</div>
      {children}
    </div>
  )
}
