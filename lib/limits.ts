const PLAN_LIMITS = {
  FREE:    { draftsPerMonth: 3,   insightsPer24h: 1  },
  STARTER: { draftsPerMonth: 50,  insightsPer24h: 3  },
  GROWTH:  { draftsPerMonth: 200, insightsPer24h: 5  },
  AGENCY:  { draftsPerMonth: 500, insightsPer24h: 10 },
} as const

type Plan = keyof typeof PLAN_LIMITS

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as Plan] ?? PLAN_LIMITS.FREE
}
