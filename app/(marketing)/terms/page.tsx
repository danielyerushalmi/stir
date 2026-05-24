export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream py-24 px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold text-brown mb-6">Terms of Service</h1>
        <p className="text-text-muted leading-relaxed mb-4">Last updated: May 2026</p>
        <p className="text-text-muted leading-relaxed mb-6">
          By using Stir you agree to these terms. Please read them carefully.
        </p>
        <h2 className="text-xl font-semibold text-brown mb-3">Use of Service</h2>
        <p className="text-text-muted leading-relaxed mb-6">
          Stir grants you a limited, non-exclusive license to use the platform for managing your restaurant&apos;s online reputation. You may not misuse the service or use it to generate harmful content.
        </p>
        <h2 className="text-xl font-semibold text-brown mb-3">Accounts</h2>
        <p className="text-text-muted leading-relaxed mb-6">
          You are responsible for maintaining the security of your account. Stir is not liable for any loss resulting from unauthorized access to your account.
        </p>
        <h2 className="text-xl font-semibold text-brown mb-3">Limitation of Liability</h2>
        <p className="text-text-muted leading-relaxed mb-6">
          Stir is provided &ldquo;as is&rdquo; without warranties of any kind. Our liability is limited to the amount you paid us in the 12 months prior to the claim.
        </p>
        <h2 className="text-xl font-semibold text-brown mb-3">Contact</h2>
        <p className="text-text-muted leading-relaxed">
          Questions? Email us at <a href="mailto:hello@stirapp.io" className="text-orange hover:underline">hello@stirapp.io</a>.
        </p>
      </div>
    </div>
  )
}
