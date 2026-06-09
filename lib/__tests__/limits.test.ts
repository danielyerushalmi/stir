import { describe, it, expect } from 'vitest'
import { getPlanLimits } from '../limits'

describe('getPlanLimits', () => {
  it('returns FREE plan limits', () => {
    expect(getPlanLimits('FREE')).toEqual({ draftsPerMonth: 3, insightsPer24h: 1 })
  })

  it('returns STARTER plan limits', () => {
    expect(getPlanLimits('STARTER')).toEqual({ draftsPerMonth: 50, insightsPer24h: 3 })
  })

  it('returns GROWTH plan limits', () => {
    expect(getPlanLimits('GROWTH')).toEqual({ draftsPerMonth: 200, insightsPer24h: 5 })
  })

  it('returns AGENCY plan limits', () => {
    expect(getPlanLimits('AGENCY')).toEqual({ draftsPerMonth: 500, insightsPer24h: 10 })
  })

  it('falls back to FREE limits for an unknown plan', () => {
    expect(getPlanLimits('ENTERPRISE')).toEqual({ draftsPerMonth: 3, insightsPer24h: 1 })
  })

  it('falls back to FREE limits for an empty plan string', () => {
    expect(getPlanLimits('')).toEqual({ draftsPerMonth: 3, insightsPer24h: 1 })
  })

  it('is case-sensitive: lowercase plan names fall back to FREE', () => {
    // The impl keys on exact-case plan names, so 'growth' is unknown -> FREE.
    expect(getPlanLimits('growth')).toEqual({ draftsPerMonth: 3, insightsPer24h: 1 })
  })

  it('higher tiers grant monotonically more drafts and insights', () => {
    const free = getPlanLimits('FREE')
    const starter = getPlanLimits('STARTER')
    const growth = getPlanLimits('GROWTH')
    const agency = getPlanLimits('AGENCY')

    expect(free.draftsPerMonth).toBeLessThan(starter.draftsPerMonth)
    expect(starter.draftsPerMonth).toBeLessThan(growth.draftsPerMonth)
    expect(growth.draftsPerMonth).toBeLessThan(agency.draftsPerMonth)

    expect(free.insightsPer24h).toBeLessThan(starter.insightsPer24h)
    expect(starter.insightsPer24h).toBeLessThan(growth.insightsPer24h)
    expect(growth.insightsPer24h).toBeLessThan(agency.insightsPer24h)
  })
})
