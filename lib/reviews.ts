export function classifyReviewType(rating: number, text: string): string {
  const lower = text.toLowerCase()
  if (rating === 5) return 'positive_5star'
  if (lower.includes('wait') || lower.includes('slow') || lower.includes('minutes')) return 'wait_complaint'
  if (lower.includes('overpriced') || lower.includes('expensive') || lower.includes('price') || lower.includes('value')) return 'price_complaint'
  if (lower.includes('cold') || lower.includes('undercooked') || lower.includes('bland') || lower.includes('tasteless') || lower.includes('food')) return 'food_complaint'
  if (lower.includes('server') || lower.includes('staff') || lower.includes('rude') || lower.includes('dismissive') || lower.includes('ignored') || lower.includes('unfriendly') || lower.includes('service')) return 'service_complaint'
  return 'mixed'
}
