import { describe, it, expect } from 'vitest'
import {
  TIERS, tierForPoints, tierProgress, type Tier,
} from '../../src/craft/tiers'
import { POINT_VALUES, pointsTotal, type PointEvent } from '../../src/craft/points'
import { useStore } from '../../src/state/store'
import { mergeState, syncableSlice, type SyncedState } from '../../src/auth/sync-merge'
import { DEFAULT_HOME } from '../../src/data/home.config'

/* The craft ladder (IA redesign 2b): five tiers, escalating medallions,
   thresholds 0 / 250 / 1000 / 2500 / 6000. Points land from a synced ledger. */

describe('craft tiers', () => {
  it('defines the five-tier ladder in order with the approved thresholds', () => {
    expect(TIERS.map((t: Tier) => t.id)).toEqual([
      'apprentice', 'journeyman', 'craftsman', 'artisan', 'master',
    ])
    expect(TIERS.map((t) => t.name)).toEqual([
      'Apprentice', 'Journeyman', 'Craftsman', 'Artisan', 'Master',
    ])
    expect(TIERS.map((t) => t.numeral)).toEqual(['I', 'II', 'III', 'IV', 'V'])
    expect(TIERS.map((t) => t.threshold)).toEqual([0, 250, 1000, 2500, 6000])
  })

  it('carries the confirmed perk per tier (2b)', () => {
    const perk = Object.fromEntries(TIERS.map((t) => [t.id, t.perk]))
    expect(perk.apprentice).toBeNull()
    expect(perk.journeyman).toMatch(/early access/i)
    expect(perk.craftsman).toMatch(/vote/i)
    expect(perk.artisan).toMatch(/ambassador/i)
    expect(perk.master).toMatch(/hunts.*flair|flair.*hunts/i)
  })

  it('maps points to the right tier at and around every threshold', () => {
    const at = (pts: number) => tierForPoints(pts).id
    expect(at(0)).toBe('apprentice')
    expect(at(249)).toBe('apprentice')
    expect(at(250)).toBe('journeyman')
    expect(at(999)).toBe('journeyman')
    expect(at(1000)).toBe('craftsman')
    expect(at(2499)).toBe('craftsman')
    expect(at(2500)).toBe('artisan')
    expect(at(5999)).toBe('artisan')
    expect(at(6000)).toBe('master')
    expect(at(120000)).toBe('master')
    expect(at(-5)).toBe('apprentice') // defensive: bad data never crashes the UI
  })

  it('reports progress toward the next tier', () => {
    const p = tierProgress(1240)
    expect(p.tier.id).toBe('craftsman')
    expect(p.next?.id).toBe('artisan')
    expect(p.ptsToNext).toBe(1260)
    expect(p.fraction).toBeCloseTo((1240 - 1000) / (2500 - 1000))
  })

  it('caps at Master with no next tier and a full bar', () => {
    const p = tierProgress(7500)
    expect(p.tier.id).toBe('master')
    expect(p.next).toBeNull()
    expect(p.ptsToNext).toBe(0)
    expect(p.fraction).toBe(1)
  })
})

describe('point economy', () => {
  it('defines the approved point values (2b "how points land")', () => {
    expect(POINT_VALUES.shotVerified).toBe(10)
    expect(POINT_VALUES.huntStop).toBe(25)
    expect(POINT_VALUES.huntFinish).toBe(100)
    expect(POINT_VALUES.critiqueGiven).toBe(15)
    expect(POINT_VALUES.referral).toBe(200)
  })

  it('sums a ledger', () => {
    const ev = (id: string, pts: number): PointEvent =>
      ({ id, at: '2026-07-15T00:00:00.000Z', reason: 'huntStop', pts })
    expect(pointsTotal([])).toBe(0)
    expect(pointsTotal([ev('a', 25), ev('b', 100), ev('c', 10)])).toBe(135)
  })
})

describe('store point ledger', () => {
  it('awardPoints appends a well-formed event', () => {
    useStore.setState({ pointEvents: [] })
    useStore.getState().awardPoints('huntStop')
    useStore.getState().awardPoints('referral')
    const events = useStore.getState().pointEvents
    expect(events).toHaveLength(2)
    expect(events[0].reason).toBe('huntStop')
    expect(events[0].pts).toBe(25)
    expect(events[1].pts).toBe(200)
    expect(events[0].id).toBeTruthy()
    expect(events[0].id).not.toBe(events[1].id)
    expect(Number.isNaN(Date.parse(events[0].at))).toBe(false)
    expect(pointsTotal(events)).toBe(225)
  })
})

describe('sync merges the point ledger', () => {
  const base: SyncedState = {
    wishlist: [], visited: [], checklist: {}, spotNotes: {}, savedPlans: [],
    pointEvents: [],
    home: DEFAULT_HOME, region: 'tampa-bay', units: 'imperial', mapsApp: 'apple', theme: 'auto',
  }
  const ev = (id: string, at: string, pts = 25): PointEvent => ({ id, at, reason: 'huntStop', pts })

  it('unions events by id so no device ever loses points', () => {
    const local = { ...base, pointEvents: [ev('a', '2026-07-01T00:00:00Z'), ev('b', '2026-07-03T00:00:00Z')] }
    const remote = { ...base, pointEvents: [ev('b', '2026-07-03T00:00:00Z'), ev('c', '2026-07-02T00:00:00Z')] }
    const merged = mergeState(local, remote)
    expect((merged.pointEvents ?? []).map((e) => e.id).sort()).toEqual(['a', 'b', 'c'])
    expect(pointsTotal(merged.pointEvents ?? [])).toBe(75)
  })

  it('tolerates remote rows that predate the ledger field', () => {
    const local = { ...base, pointEvents: [ev('a', '2026-07-01T00:00:00Z')] }
    const remote = { ...base } as SyncedState & { pointEvents?: PointEvent[] }
    delete remote.pointEvents
    const merged = mergeState(local, remote)
    expect((merged.pointEvents ?? []).map((e) => e.id)).toEqual(['a'])
  })

  it('includes the ledger in the pushed slice', () => {
    useStore.setState({ pointEvents: [ev('x', '2026-07-10T00:00:00Z')] })
    const slice = syncableSlice(useStore.getState())
    expect((slice.pointEvents ?? []).map((e) => e.id)).toEqual(['x'])
  })
})
