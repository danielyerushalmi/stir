// 'unsafe-eval' is required by Next.js's dev-mode tooling only — keeping it
// out of the production CSP restores most of the XSS protection eval defeats.
const scriptSrc = process.env.NODE_ENV === 'development'
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'unsafe-inline'"

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: `default-src 'self'; script-src ${scriptSrc} https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com; connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.com https://clerk-telemetry.com https://challenges.cloudflare.com; img-src 'self' data: https://img.clerk.com https://images.clerk.dev https://images.unsplash.com; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; frame-src https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com; worker-src 'self' blob:; object-src 'none'; base-uri 'none';` },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

export default nextConfig
