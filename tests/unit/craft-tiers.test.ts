import { describe, it, expect } from 'vitest'
import {
  TIERS, tierForPoints, tierProgress, type Tier,
} from '../../src/craft/tiers'
import { POINT_VALUES, pointsTotal, photoQuotaForPoints, type PointEvent } from '../../src/craft/points'

/* The craft ladder (IA redesign 2b): five tiers, escalating medallions,
   thresholds 0 / 250 / 1000 / 2500 / 6000. The ledger itself lives
   server-side (point_events, RPC-minted — see points-api tests). */

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
    // Community shots (2026-07-16): a shot rated >=4.0 by >=3 peers.
    expect(POINT_VALUES.topShot).toBe(25)
  })

  it('grows the per-spot photo quota with points — mirrors the SQL photo_quota map', () => {
    expect(photoQuotaForPoints(0)).toBe(2)      // Apprentice
    expect(photoQuotaForPoints(249)).toBe(2)
    expect(photoQuotaForPoints(250)).toBe(3)    // Journeyman
    expect(photoQuotaForPoints(1000)).toBe(4)   // Craftsman
    expect(photoQuotaForPoints(2500)).toBe(6)   // Artisan
    expect(photoQuotaForPoints(6000)).toBe(8)   // Master
  })

  it('sums a ledger', () => {
    const ev = (id: string, pts: number): PointEvent =>
      ({ id, at: '2026-07-15T00:00:00.000Z', reason: 'huntStop', pts })
    expect(pointsTotal([])).toBe(0)
    expect(pointsTotal([ev('a', 25), ev('b', 100), ev('c', 10)])).toBe(135)
  })
})

