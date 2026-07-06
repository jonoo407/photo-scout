import { describe, it, expect } from 'vitest'
import { SPOT_REGION, REGION_SPOT_COUNT } from '../../src/data/spot-index'
import tampa from '../../src/data/spots/tampa-bay'
import philadelphia from '../../src/data/spots/philadelphia'

/* The committed index must exactly mirror the data files — regenerate with
   `node scripts/build-spot-index.mjs` whenever spots change. It lets Saved,
   deep links, and progress resolve a spot's city WITHOUT loading every
   city's chunk (docs/SCALING.md breakpoint 1). */

const REAL: Record<string, typeof tampa> = { 'tampa-bay': tampa, philadelphia }

describe('spot index', () => {
  it('maps every spot id to its region — no misses, no strays', () => {
    const expected = new Map<string, string>()
    for (const [region, spots] of Object.entries(REAL)) {
      for (const s of spots) expected.set(s.id, region)
    }
    expect(Object.keys(SPOT_REGION).sort()).toEqual([...expected.keys()].sort())
    for (const [id, region] of expected) {
      expect(SPOT_REGION[id], `index region for ${id}`).toBe(region)
    }
  })

  it('carries exact per-region totals (drives the Saved progress strip)', () => {
    for (const [region, spots] of Object.entries(REAL)) {
      expect(REGION_SPOT_COUNT[region], `count for ${region}`).toBe(spots.length)
    }
  })
})
