import { describe, it, expect } from 'vitest'
import { regionProgress } from '../../src/spots/progress'
import type { Spot } from '../../src/spots/types'

// Minimal fixtures — regionProgress only reads id + region.
const spot = (id: string, region: string) => ({ id, region }) as unknown as Spot

const SPOTS: Spot[] = [
  spot('t1', 'tampa-bay'),
  spot('t2', 'tampa-bay'),
  spot('t3', 'tampa-bay'),
  spot('p1', 'philadelphia'),
  spot('p2', 'philadelphia'),
]

describe('regionProgress', () => {
  it('counts visited spots per region against that region\'s total', () => {
    expect(regionProgress(['t1', 't3', 'p2'], SPOTS)).toEqual([
      { regionId: 'tampa-bay', label: 'Tampa Bay', done: 2, total: 3 },
      { regionId: 'philadelphia', label: 'Philadelphia', done: 1, total: 2 },
    ])
  })

  it('includes a region at zero when nothing there is visited', () => {
    expect(regionProgress(['p1'], SPOTS)).toEqual([
      { regionId: 'tampa-bay', label: 'Tampa Bay', done: 0, total: 3 },
      { regionId: 'philadelphia', label: 'Philadelphia', done: 1, total: 2 },
    ])
  })

  it('ignores visited ids that no longer exist and counts duplicates once', () => {
    expect(regionProgress(['t1', 't1', 'gone-spot'], SPOTS)).toEqual([
      { regionId: 'tampa-bay', label: 'Tampa Bay', done: 1, total: 3 },
      { regionId: 'philadelphia', label: 'Philadelphia', done: 0, total: 2 },
    ])
  })

  it('returns [] with no spots loaded', () => {
    expect(regionProgress(['t1'], [])).toEqual([])
  })

  it('keeps REGIONS declaration order regardless of spot order', () => {
    const shuffled = [SPOTS[3], SPOTS[0], SPOTS[4], SPOTS[1], SPOTS[2]]
    expect(regionProgress([], shuffled).map((p) => p.regionId)).toEqual([
      'tampa-bay',
      'philadelphia',
    ])
  })
})
