import { describe, it, expect } from 'vitest'
import { planUrl, parsePinnedPlan } from '../../src/spots/plan-link'

const STOPS = [
  { block: 'sunrise' as const, spotId: 'bayshore-boulevard' },
  { block: 'sunset' as const, spotId: 'honeymoon-island-sp' },
]

describe('planUrl', () => {
  it('encodes date + stops as a shareable day link', () => {
    expect(planUrl('2026-07-12', STOPS)).toBe(
      'https://shootvantage.com/#/day?date=2026-07-12&stops=sunrise:bayshore-boulevard,sunset:honeymoon-island-sp',
    )
  })
})

describe('parsePinnedPlan', () => {
  const parse = (qs: string) => parsePinnedPlan(new URLSearchParams(qs))

  it('round-trips what planUrl wrote', () => {
    const p = parse('date=2026-07-12&stops=sunrise:bayshore-boulevard,sunset:honeymoon-island-sp')
    expect(p).not.toBeNull()
    expect(p!.dateYmd).toBe('2026-07-12')
    // device-local noon: immune to timezone midnight rolls
    expect(p!.date.getHours()).toBe(12)
    expect(p!.stops).toEqual(STOPS)
  })

  it('rejects garbage: bad date, unknown blocks, hostile ids, dupes', () => {
    expect(parse('date=nope&stops=sunrise:a')).toBeNull()
    expect(parse('date=2026-07-12&stops=brunch:a')).toBeNull()
    const p = parse('date=2026-07-12&stops=sunrise:ok-spot,sunrise:dupe,midday:<script>')
    expect(p!.stops).toEqual([{ block: 'sunrise', spotId: 'ok-spot' }]) // dupes + hostile dropped
  })

  it('returns null when there is nothing pinned (normal planner mode)', () => {
    expect(parse('day=1')).toBeNull()
    expect(parse('date=2026-07-12')).toBeNull()
  })
})
