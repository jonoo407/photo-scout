import { describe, it, expect } from 'vitest'
import { regionProgress, savedProgress } from '../../src/spots/progress'
import { SPOT_REGION, REGION_SPOT_COUNT } from '../../src/data/spot-index'

// Pure core: progress from an id→region map + per-region totals — no spot
// modules loaded (docs/SCALING.md breakpoint 1).
const IDX = { t1: 'tampa-bay', t2: 'tampa-bay', t3: 'tampa-bay', p1: 'philadelphia', p2: 'philadelphia' }
const TOTALS = { 'tampa-bay': 3, philadelphia: 2 }

describe('regionProgress', () => {
  it('counts visited spots per region against that region\'s total', () => {
    expect(regionProgress(['t1', 't3', 'p2'], IDX, TOTALS)).toEqual([
      { regionId: 'tampa-bay', label: 'Tampa Bay', done: 2, total: 3 },
      { regionId: 'philadelphia', label: 'Philadelphia', done: 1, total: 2 },
    ])
  })

  it('includes a region at zero when nothing there is visited', () => {
    expect(regionProgress(['p1'], IDX, TOTALS)).toEqual([
      { regionId: 'tampa-bay', label: 'Tampa Bay', done: 0, total: 3 },
      { regionId: 'philadelphia', label: 'Philadelphia', done: 1, total: 2 },
    ])
  })

  it('ignores visited ids that no longer exist and counts duplicates once', () => {
    expect(regionProgress(['t1', 't1', 'gone-spot'], IDX, TOTALS)).toEqual([
      { regionId: 'tampa-bay', label: 'Tampa Bay', done: 1, total: 3 },
      { regionId: 'philadelphia', label: 'Philadelphia', done: 0, total: 2 },
    ])
  })

  it('returns [] with no totals', () => {
    expect(regionProgress(['t1'], IDX, {})).toEqual([])
  })

  it('keeps REGIONS declaration order regardless of input order', () => {
    expect(regionProgress([], { p1: 'philadelphia', t1: 'tampa-bay' }, { philadelphia: 1, 'tampa-bay': 1 })
      .map((p) => p.regionId)).toEqual(['tampa-bay', 'philadelphia'])
  })
})

describe('savedProgress (bound to the generated index)', () => {
  it('reports real per-city totals without loading any spot module', () => {
    const rows = savedProgress(['bayshore-boulevard'])
    const tampa = rows.find((r) => r.regionId === 'tampa-bay')!
    expect(tampa.done).toBe(1)
    expect(tampa.total).toBe(REGION_SPOT_COUNT['tampa-bay'])
    expect(SPOT_REGION['bayshore-boulevard']).toBe('tampa-bay')
  })
})
