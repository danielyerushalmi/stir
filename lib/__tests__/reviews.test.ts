import { describe, it, expect } from 'vitest'
import { classifyReviewType } from '../reviews'

describe('classifyReviewType', () => {
  it('classifies a positive review', () => {
    expect(classifyReviewType(5, 'Great food and amazing service!')).toBe('positive_5star')
  })
  it('classifies a wait complaint', () => {
    expect(classifyReviewType(2, 'Waited 40 minutes for our food, unacceptable.')).toBe('wait_complaint')
  })
  it('classifies a food complaint', () => {
    expect(classifyReviewType(2, 'The risotto was undercooked and tasteless.')).toBe('food_complaint')
  })
  it('classifies a price complaint', () => {
    expect(classifyReviewType(3, 'Way too expensive for the portion size.')).toBe('price_complaint')
  })
  it('defaults to mixed for ambiguous reviews', () => {
    expect(classifyReviewType(3, 'Nice atmosphere but nothing stood out.')).toBe('mixed')
  })
})
