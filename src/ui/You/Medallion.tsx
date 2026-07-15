import type { Tier } from '../../craft/tiers'

/* Craft medallion (handoff 2b): a Fraunces numeral in a circle whose ring
   gets visibly cooler per tier — dashed → double ring → amber halo →
   terracotta tick ring → gold conic glow. Artisan/Master rings are gradient
   wrappers, so `size` is always the finished outer diameter. */
export function Medallion({ tier, size = 40 }: { tier: Tier; size?: number }) {
  const pad = tier.id === 'master' ? 3.5 : tier.id === 'artisan' ? 3 : 0
  const inner = size - pad * 2
  const medallion = (
    <span
      className={`medallion med-${tier.id}`}
      style={{ width: inner, height: inner, fontSize: Math.round(size * 0.38) }}
      role="img"
      aria-label={`${tier.name} medallion`}
    >
      {tier.numeral}
    </span>
  )
  if (!pad) return medallion
  return <span className={`medring med-${tier.id}`}>{medallion}</span>
}
