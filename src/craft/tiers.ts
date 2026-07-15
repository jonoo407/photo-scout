/* The craft ladder (IA redesign, screen 2b): five tiers with escalating
   medallion treatments. Thresholds and perks are the approved economy —
   change them only alongside the design doc. */

export type TierId = 'apprentice' | 'journeyman' | 'craftsman' | 'artisan' | 'master'

export interface Tier {
  id: TierId
  name: string
  numeral: 'I' | 'II' | 'III' | 'IV' | 'V'
  /** Lifetime points where this tier begins. */
  threshold: number
  /** The one perk slot per tier; Apprentice has none. */
  perk: string | null
}

export const TIERS: readonly Tier[] = [
  { id: 'apprentice', name: 'Apprentice', numeral: 'I', threshold: 0, perk: null },
  { id: 'journeyman', name: 'Journeyman', numeral: 'II', threshold: 250, perk: 'Early access to new hunts' },
  { id: 'craftsman', name: 'Craftsman', numeral: 'III', threshold: 1000, perk: '×2 vote in the city scoreboard' },
  { id: 'artisan', name: 'Artisan', numeral: 'IV', threshold: 2500, perk: 'Ambassador eligibility' },
  { id: 'master', name: 'Master', numeral: 'V', threshold: 6000, perk: 'Create your own hunts + gold profile flair' },
]

/** The tier a lifetime-points total sits in (bad input clamps to Apprentice). */
export function tierForPoints(points: number): Tier {
  let current = TIERS[0]
  for (const t of TIERS) if (points >= t.threshold) current = t
  return current
}

export interface TierProgress {
  tier: Tier
  /** null at Master — the ladder tops out. */
  next: Tier | null
  ptsToNext: number
  /** 0–1 position between the current and next threshold (1 at Master). */
  fraction: number
}

export function tierProgress(points: number): TierProgress {
  const tier = tierForPoints(points)
  const next = TIERS[TIERS.indexOf(tier) + 1] ?? null
  if (!next) return { tier, next: null, ptsToNext: 0, fraction: 1 }
  const span = next.threshold - tier.threshold
  const into = Math.max(0, points - tier.threshold)
  return { tier, next, ptsToNext: next.threshold - points, fraction: Math.min(1, into / span) }
}
