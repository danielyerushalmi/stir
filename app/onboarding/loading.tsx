export default function OnboardingLoading() {
  return (
    <div className="flex flex-col items-center gap-3 text-text-muted">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-orange" />
      <p className="text-sm">Setting up your account…</p>
    </div>
  )
}
