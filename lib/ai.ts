import Anthropic from '@anthropic-ai/sdk'
import { db } from './db'
import { classifyReviewType } from './reviews'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export function buildDraftSystemPrompt(
  restaurantName: string,
  vibe: string,
  samples: { sampleReview: string; ownerResponse: string }[],
): string {
  const examplesBlock = samples.length > 0
    ? `\n\nHere are real responses the owner has written. Match their tone, length, and vocabulary exactly:\n\n${samples.map((s, i) => `Example ${i + 1}:\nReview: "${s.sampleReview}"\nOwner response: "${s.ownerResponse}"`).join('\n\n')}`
    : ''

  return `You write review responses for ${restaurantName}, a restaurant described as: "${vibe}"

Rules:
- Match the owner's exact tone, vocabulary, and length from the examples
- 2–4 sentences maximum
- Never start with "Thank you for your feedback" or generic openers
- Be specific to this review — reference actual details mentioned
- For negative reviews: acknowledge the specific issue, show genuine care, invite them back
- For positive reviews: genuine gratitude with a personal touch
- Never make promises you can't keep ("we've fixed it", "this won't happen again")
- Output the response text only — no labels, quotes, or wrappers${examplesBlock}`
}

export async function generateDraft(reviewId: string): Promise<string> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: { restaurant: { include: { voiceSamples: true } } },
  })
  if (!review) throw new Error('Review not found')
  if (review.restaurant.voiceSamples.length === 0) throw new Error('NO_VOICE_SAMPLES')

  const reviewType = classifyReviewType(review.rating, review.reviewText)
  const relevantSamples = review.restaurant.voiceSamples
    .filter(s => s.reviewType === reviewType)
    .slice(0, 2)
    .concat(review.restaurant.voiceSamples.filter(s => s.reviewType !== reviewType).slice(0, 1))

  const systemPrompt = buildDraftSystemPrompt(
    review.restaurant.name,
    review.restaurant.vibe,
    relevantSamples.map(s => ({ sampleReview: s.sampleReview, ownerResponse: s.ownerResponse })),
  )

  const message = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Write a response to this review (${review.rating} stars):\n"${review.reviewText}"` }],
  })

  return (message.content[0] as { type: 'text'; text: string }).text.trim()
}

export async function generateInsights(restaurantId: string): Promise<void> {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  const reviews = await db.review.findMany({
    where: { restaurantId, reviewDate: { gte: since } },
    orderBy: { reviewDate: 'desc' },
  })
  if (reviews.length === 0) return

  const reviewSummary = reviews.map(r => `[${r.platform}] ${r.rating}★ "${r.reviewText}"`).join('\n')

  const message = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: 'You are a restaurant business analyst. Analyse review data and return a JSON array of insights. Each insight: { "type": "ALERT"|"TIP"|"DELIVERY_GAP", "title": string, "body": string (1-2 sentences), "reviewCount": number, "platforms": string[] }. Return only valid JSON, no other text.',
    messages: [{ role: 'user', content: `Analyse these reviews from the last 60 days and identify the top 3–5 actionable insights:\n\n${reviewSummary}` }],
  })

  const raw = (message.content[0] as { type: 'text'; text: string }).text.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '')
  let insights: { type: string; title: string; body: string; reviewCount: number; platforms: string[] }[]
  try {
    insights = JSON.parse(raw)
  } catch {
    throw new Error('AI returned malformed JSON for insights')
  }

  await db.insight.deleteMany({ where: { restaurantId } })
  await db.insight.createMany({ data: insights.map(i => ({ restaurantId, ...i })) })
}
