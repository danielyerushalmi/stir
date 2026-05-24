export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream py-24 px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold text-brown mb-6">Privacy Policy</h1>
        <p className="text-text-muted leading-relaxed mb-4">Last updated: May 2026</p>
        <p className="text-text-muted leading-relaxed mb-6">
          Stir (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the Stir platform. This page informs you of our policies regarding the collection, use, and disclosure of personal information when you use our service.
        </p>
        <h2 className="text-xl font-semibold text-brown mb-3">Information We Collect</h2>
        <p className="text-text-muted leading-relaxed mb-6">
          We collect information you provide directly, including your name, email address, and restaurant information. We also collect data from platforms you connect (Google, Yelp, TripAdvisor) solely to provide the service.
        </p>
        <h2 className="text-xl font-semibold text-brown mb-3">How We Use Your Information</h2>
        <p className="text-text-muted leading-relaxed mb-6">
          We use your information to provide, maintain, and improve the Stir service — including generating AI-drafted responses in your voice and surfacing insights from your review data. We do not sell your data to third parties.
        </p>
        <h2 className="text-xl font-semibold text-brown mb-3">Contact</h2>
        <p className="text-text-muted leading-relaxed">
          Questions? Email us at <a href="mailto:hello@stirapp.io" className="text-orange hover:underline">hello@stirapp.io</a>.
        </p>
      </div>
    </div>
  )
}
