/** @type {import('next').NextConfig} */
const nextConfig = {
  // Provide a placeholder DATABASE_URL at build time so PrismaClient can be constructed.
  // Prisma v7 requires a non-empty connection string to instantiate (even without a real DB).
  // The actual connection string is loaded from .env.local at runtime.
  env: {
    DATABASE_URL:
      process.env.DATABASE_URL ||
      'postgresql://build:build@localhost:5432/build',
  },
}

export default nextConfig
