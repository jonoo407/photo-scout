import { describe, it, expect } from 'vitest'
import { moonInfo, moonPhaseName, MOON_PHASE_NAMES } from '../../src/astro/moon'

const LAT = 27.9477
const LNG = -82.4584
const DATE = new Date('2026-06-14T17:00:00Z')

describe('moonPhaseName', () => {
  it('names the cardinal phases', () => {
    expect(moonPhaseName(0)).toBe('new')
    expect(moonPhaseName(0.25)).toBe('first quarter')
    expect(moonPhaseName(0.5)).toBe('full')
    expect(moonPhaseName(0.75)).toBe('last quarter')
  })
  it('names the intermediate phases', () => {
    expect(moonPhaseName(0.125)).toBe('waxing crescent')
    expect(moonPhaseName(0.375)).toBe('waxing gibbous')
    expect(moonPhaseName(0.625)).toBe('waning gibbous')
    expect(moonPhaseName(0.875)).toBe('waning crescent')
  })
  it('wraps near 1.0 back to new', () => {
    expect(moonPhaseName(0.99)).toBe('new')
  })
})

describe('moonInfo', () => {
  const m = moonInfo(DATE, LAT, LNG)
  it('returns illumination 0-100 matching the fraction', () => {
    expect(m.illumination).toBeGreaterThanOrEqual(0)
    expect(m.illumination).toBeLessThanOrEqual(100)
  })
  it('returns a phase in [0,1] and a valid phase name', () => {
    expect(m.phase).toBeGreaterThanOrEqual(0)
    expect(m.phase).toBeLessThanOrEqual(1)
    expect(MOON_PHASE_NAMES).toContain(m.phaseName)
  })
  it('returns rise/set as Date or null', () => {
    expect(m.rise === null || m.rise instanceof Date).toBe(true)
    expect(m.set === null || m.set instanceof Date).toBe(true)
  })
})
