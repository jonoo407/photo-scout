import { describe, it, expect } from 'vitest'
import { galacticCoreAltAz, coreWindow, nextCoreWindow } from '../../src/astro/milky-way'

const TAMPA = { lat: 27.94, lng: -82.55, tz: 'America/New_York' }

describe('galacticCoreAltAz', () => {
  it('mid-June 2 AM in Tampa: core rides high in the southern sky', () => {
    // Core (dec −29°) tops out at ~33° from Tampa, transiting near solar midnight in June.
    const p = galacticCoreAltAz(new Date('2026-06-15T06:00:00Z'), TAMPA.lat, TAMPA.lng)
    expect(p.altitude).toBeGreaterThan(20)
    expect(p.altitude).toBeLessThan(35)
    expect(p.azimuth).toBeGreaterThan(140)
    expect(p.azimuth).toBeLessThan(230)
  })

  it('December midnight in Tampa: core is below the horizon', () => {
    const p = galacticCoreAltAz(new Date('2026-12-21T05:00:00Z'), TAMPA.lat, TAMPA.lng)
    expect(p.altitude).toBeLessThan(0)
  })
})

describe('coreWindow', () => {
  it('finds a core-season window on a June night, fully inside astronomical darkness', () => {
    const w = coreWindow(new Date('2026-06-15T16:00:00Z'), TAMPA.lat, TAMPA.lng, TAMPA.tz)
    expect(w).not.toBeNull()
    expect(w!.peakAltitude).toBeGreaterThan(15)
    expect(w!.end.getTime()).toBeGreaterThan(w!.start.getTime())
    const hours = (w!.end.getTime() - w!.start.getTime()) / 3_600_000
    expect(hours).toBeGreaterThan(0.5)
    expect(hours).toBeLessThan(9)
    expect(w!.moonIllumination).toBeGreaterThanOrEqual(0)
    expect(w!.moonIllumination).toBeLessThanOrEqual(100)
    expect(typeof w!.moonUp).toBe('boolean')
  })

  it('returns null in the December off-season', () => {
    expect(coreWindow(new Date('2026-12-21T17:00:00Z'), TAMPA.lat, TAMPA.lng, TAMPA.tz)).toBeNull()
  })
})

describe('nextCoreWindow', () => {
  it('in June, tonight already has a window', () => {
    const n = nextCoreWindow(new Date('2026-06-15T16:00:00Z'), TAMPA.lat, TAMPA.lng, TAMPA.tz)
    expect(n).not.toBeNull()
    expect(n!.window.start.getTime() - new Date('2026-06-15T16:00:00Z').getTime()).toBeLessThan(24 * 3_600_000)
  })

  it('from late December, the season resumes within ~60 nights (pre-dawn core)', () => {
    const from = new Date('2026-12-21T17:00:00Z')
    const n = nextCoreWindow(from, TAMPA.lat, TAMPA.lng, TAMPA.tz)
    expect(n).not.toBeNull()
    const days = (n!.window.start.getTime() - from.getTime()) / 86_400_000
    expect(days).toBeGreaterThan(7)
    expect(days).toBeLessThan(75)
  })
})
