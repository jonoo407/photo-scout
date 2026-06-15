import { describe, it, expect } from 'vitest'
import { sunPosition } from '../../src/astro/sun-position'
import { computeSunTimes } from '../../src/astro/sun-times'

const LAT = 27.9477
const LNG = -82.4584
const DATE = new Date('2026-06-14T17:00:00Z')
const t = computeSunTimes(DATE, LAT, LNG)

describe('sunPosition', () => {
  it('is high and due-south at solar noon in mid-June Tampa', () => {
    const p = sunPosition(t.solarNoon, LAT, LNG)
    expect(p.elevation).toBeGreaterThan(83)
    expect(p.elevation).toBeLessThan(88)
    expect(p.azimuth).toBeGreaterThan(165)
    expect(p.azimuth).toBeLessThan(195)
  })

  it('rises in the east-northeast (azimuth ~60-75) near 0 deg elevation', () => {
    const p = sunPosition(t.sunrise, LAT, LNG)
    expect(p.azimuth).toBeGreaterThan(55)
    expect(p.azimuth).toBeLessThan(78)
    expect(Math.abs(p.elevation)).toBeLessThan(2)
  })

  it('sets in the west-northwest (azimuth ~285-305)', () => {
    const p = sunPosition(t.sunset, LAT, LNG)
    expect(p.azimuth).toBeGreaterThan(283)
    expect(p.azimuth).toBeLessThan(307)
  })

  it('always returns a compass azimuth in [0, 360)', () => {
    for (let h = 0; h < 24; h++) {
      const d = new Date('2026-06-14T00:00:00Z')
      d.setUTCHours(h)
      const az = sunPosition(d, LAT, LNG).azimuth
      expect(az).toBeGreaterThanOrEqual(0)
      expect(az).toBeLessThan(360)
    }
  })
})
