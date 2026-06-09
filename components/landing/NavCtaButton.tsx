'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

export function NavCtaButton() {
  return (
    <motion.div
      className="inline-block"
      whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      whileTap={{ y: 1, scale: 0.97, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
    >
      <Link
        href="/sign-up"
        className="rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
      >
        Start free
      </Link>
    </motion.div>
  )
}
