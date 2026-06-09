function hasAnyWord(text: string, keywords: string[]): boolean {
  return keywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(text))
}

export function classifyReviewType(rating: number, text: string): string {
  if (rating === 5) return 'positive_5star'
  if (hasAnyWord(text, ['wait', 'slow', 'minutes'])) return 'wait_complaint'
  if (hasAnyWord(text, ['overpriced', 'expensive', 'price', 'value'])) return 'price_complaint'
  if (hasAnyWord(text, ['cold', 'undercooked', 'bland', 'tasteless', 'food'])) return 'food_complaint'
  if (hasAnyWord(text, ['server', 'staff', 'rude', 'dismissive', 'ignored', 'unfriendly', 'service'])) return 'service_complaint'
  return 'mixed'
}
