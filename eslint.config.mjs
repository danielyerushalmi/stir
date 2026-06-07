// Flat ESLint config for Next 16 (which removed the built-in `next lint`).
// Mirrors the previous .eslintrc.json (`next/core-web-vitals` + `next/typescript`),
// consuming eslint-config-next@16's flat-config exports.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'app/generated/**',
      '.claude/**',
      'next-env.d.ts',
      'prisma/migrations/**',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // New in react-hooks v6 (bundled with eslint-config-next@16). Our flagged
      // cases are all idiomatic "sync state from a browser-only API on mount"
      // effects (prefers-reduced-motion, localStorage) that can't run during SSR.
      // Keep it visible as a warning rather than failing the build.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]

export default eslintConfig
