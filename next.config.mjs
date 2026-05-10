/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
  },
}

export default nextConfig
