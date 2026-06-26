import { describe, it, expect } from 'vitest'
import { planDay, dayBlocks } from '../../src/spots/day-plan'
import { matchesLight } from '../../src/spots/next-up'
import { SPOTS } from '../../src/data/spots'
import { DEFAULT_HOME } from '../../src/data/home.config'

// Fixed date (Thu Jun 25 2026, local noon) so the plan is deterministic.
const DATE = new Date(2026, 5, 25, 12, 0, 0)

describe('dayBlocks', () => {
  it('produces morning, midday and evening blocks in time order', () => {
    const b = dayBlocks(DATE, DEFAULT_HOME.lat, DEFAULT_HOME.lng)
    expect(b.map((x) => x.key)).toEqual(['sunrise', 'midday', 'sunset'])
    expect(b[0].time.getTime()).toBeLessThan(b[1].time.getTime())
    expect(b[1].time.getTime()).toBeLessThan(b[2].time.getTime())
  })
})

describe('planDay', () => {
  it('returns at least a morning and an evening stop', () => {
    const stops = planDay({ date: DATE, home: DEFAULT_HOME, spots: SPOTS })
    expect(stops.length).toBeGreaterThanOrEqual(2)
  })

  it('never repeats a spot across the day (fixes the 2-spot collapse)', () => {
    const ids = planDay({ date: DATE, home: DEFAULT_HOME, spots: SPOTS }).map((s) => s.spot.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('matches each non-anchor stop to its block’s light', () => {
    for (const s of planDay({ date: DATE, home: DEFAULT_HOME, spots: SPOTS })) {
      expect(s.block.lights.some((l) => matchesLight(s.spot, l))).toBe(true)
    }
  })

  it('orders stops by time of day', () => {
    const stops = planDay({ date: DATE, home: DEFAULT_HOME, spots: SPOTS })
    for (let i = 1; i < stops.length; i++) {
      expect(stops[i].block.time.getTime()).toBeGreaterThan(stops[i - 1].block.time.getTime())
    }
  })

  it('honors an anchor: places it exactly once and flags it', () => {
    const stops = planDay({ date: DATE, home: DEFAULT_HOME, spots: SPOTS, anchorId: 'dali-museum' })
    const dali = stops.filter((s) => s.spot.id === 'dali-museum')
    expect(dali).toHaveLength(1)
    expect(dali[0].anchored).toBe(true)
  })

  it('offers ranked alternatives for swapping', () => {
    const stops = planDay({ date: DATE, home: DEFAULT_HOME, spots: SPOTS })
    expect(stops[0].alternatives.length).toBeGreaterThan(0)
    expect(stops[0].alternatives.every((a) => a.id !== stops[0].spot.id)).toBe(true)
  })
})
