'use client'
import { motion } from 'framer-motion'

const TESTIMONIALS = [
  { quote: "We went from ignoring reviews to replying to every single one. Our Google rating went from 3.8 to 4.5 in 3 months.", name: 'Maria Santos', role: 'Owner, Café Paradiso', rating: 5, from: -40 },
  { quote: "The AI sounds exactly like me. Customers have commented that our responses feel personal and genuine. It's wild.", name: 'James Park', role: "Owner, Park's Kitchen", rating: 5, from: 40 },
  { quote: "Stir found a pattern in our delivery reviews I had never noticed. Fixed it. Our DoorDash rating jumped 0.7 stars.", name: 'Elena Moretti', role: 'Owner, Trattoria Elena', rating: 5, from: -40 },
]

export function TestimonialsSection() {
  return (
    <section className="bg-white py-24 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-semibold text-brown mb-4">Restaurants that made the switch</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: t.from }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
              whileHover={{ y: -5, transition: { type: 'spring', stiffness: 280, damping: 20 } }}
              className="rounded-2xl border border-border p-6 bg-cream"
            >
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.3 }}
                className="mb-4 text-orange text-sm"
              >
                {'★'.repeat(t.rating)}
              </motion.div>
              <p className="text-brown text-base leading-relaxed mb-4">&quot;{t.quote}&quot;</p>
              <div>
                <p className="font-medium text-brown text-sm">{t.name}</p>
                <p className="text-xs text-text-muted">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
