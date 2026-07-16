import { describe, it, expect } from 'vitest'
import {
  huntStatus, stopState, isOpen, maxPoints,
  type Hunt, type HuntProgressRow,
} from '../../src/hunts/hunts'

/* Photo hunts (B14 / handoff 2c-2d), pure core: completion math and the
   sequential-unlock rule the server also enforces. */

const HUNT: Hunt = {
  id: 'golden-hour-grand-tour', region: 'tampa-bay', title: 'Golden Hour Grand Tour', blurb: null,
  stops: [
    { spotId: 'bayshore-boulevard', name: 'Bayshore Boulevard', lat: 27.9165, lng: -82.4827, hint: 'balustrade' },
    { spotId: 'plant-park-ut-minarets', name: 'Plant Park / UT Minarets', lat: 27.9459, lng: -82.4646 },
    { spotId: 'tampa-riverwalk', name: 'Tampa Riverwalk', lat: 27.9468, lng: -82.4618 },
  ],
  stopPts: 25, finishPts: 100, opensAt: null, closesAt: null,
}

const row = (stopIndex: number): HuntProgressRow => ({
  huntId: HUNT.id, stopIndex, photoPath: `u/p${stopIndex}.jpg`, createdAt: '2026-07-15T00:00:00Z',
})

describe('huntStatus', () => {
  it('reports fresh, mid, and finished states', () => {
    expect(huntStatus(HUNT, [])).toEqual({ done: 0, total: 3, finished: false, nextIndex: 0 })
    expect(huntStatus(HUNT, [row(0), row(1)])).toEqual({ done: 2, total: 3, finished: false, nextIndex: 2 })
    expect(huntStatus(HUNT, [row(0), row(1), row(2)])).toEqual({ done: 3, total: 3, finished: true, nextIndex: null })
  })

  it('ignores duplicate rows defensively', () => {
    expect(huntStatus(HUNT, [row(0), row(0)]).done).toBe(1)
  })
})

describe('stopState — stops unlock in order', () => {
  it('marks done, next, and locked stops', () => {
    expect(stopState(0, 1)).toBe('done')
    expect(stopState(1, 1)).toBe('next')
    expect(stopState(2, 1)).toBe('locked')
  })
})

describe('isOpen', () => {
  const now = new Date('2026-07-15T12:00:00Z')
  it('evergreen hunts are always open', () => {
    expect(isOpen(HUNT, now)).toBe(true)
  })
  it('respects opens_at and closes_at windows', () => {
    expect(isOpen({ ...HUNT, opensAt: '2026-08-01T00:00:00Z' }, now)).toBe(false)
    expect(isOpen({ ...HUNT, closesAt: '2026-07-01T00:00:00Z' }, now)).toBe(false)
    expect(isOpen({ ...HUNT, opensAt: '2026-07-01T00:00:00Z', closesAt: '2026-08-01T00:00:00Z' }, now)).toBe(true)
  })
})

describe('maxPoints', () => {
  it('is stops × stop points + finish bonus', () => {
    expect(maxPoints(HUNT)).toBe(3 * 25 + 100)
  })
})
