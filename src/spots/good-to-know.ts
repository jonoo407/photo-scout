import type { Spot } from './types'

/* "Good to know" earns its heading (tester report, build 15). The section
   rendered its title unconditionally, so most spots showed a heading over an
   empty box — one predicate, kept in lockstep with what the section renders. */
export function hasGoodToKnow(spot: Spot): boolean {
  const l = spot.logistics
  return Boolean(
    l?.parking ||
    l?.restrooms ||
    l?.crowdTiming ||
    l?.dressCode ||
    spot.feeNote ||
    spot.phone ||
    spot.caveats ||
    spot.craft?.accessTips,
  )
}
