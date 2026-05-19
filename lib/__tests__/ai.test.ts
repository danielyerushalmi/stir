// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { buildDraftSystemPrompt } from '../ai'

describe('buildDraftSystemPrompt', () => {
  it('includes restaurant name and vibe', () => {
    const prompt = buildDraftSystemPrompt('The Corner Table', 'warm and casual', [])
    expect(prompt).toContain('The Corner Table')
    expect(prompt).toContain('warm and casual')
  })

  it('includes voice samples when provided', () => {
    const samples = [{ sampleReview: 'Great food!', ownerResponse: 'Thanks so much!' }]
    const prompt = buildDraftSystemPrompt('Trattoria', 'cosy Italian', samples)
    expect(prompt).toContain('Great food!')
    expect(prompt).toContain('Thanks so much!')
  })

  it('enforces the no-thank-you-for-feedback rule', () => {
    const prompt = buildDraftSystemPrompt('X', 'y', [])
    expect(prompt).toContain('Never start with')
  })
})
