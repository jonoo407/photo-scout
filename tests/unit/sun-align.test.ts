import { describe, it, expect } from 'vitest'
import { sunAlignmentDates } from '../../src/spots/sun-align'

const TAMPA = { lat: 27.94, lng: -82.55, tz: 'America/New_York' }
const FROM = new Date('2026-07-01T16:00:00Z')

describe('sunAlignmentDates', () => {
  it('facing due west: sunset aligns near the September equinox', () => {
    const hits = sunAlignmentDates(270, TAMPA.lat, TAMPA.lng, TAMPA.tz, FROM)
    expect(hits.length).toBeGreaterThan(0)
    const first = hits[0]
    expect(first.kind).toBe('sunset')
    expect(first.at.getUTCFullYear()).toBe(2026)
    expect(first.at.getUTCMonth()).toBe(8) // September
    expect(first.delta).toBeLessThanOrEqual(2)
  })

  it('facing due east: sunrise aligns near the September equinox', () => {
    const hits = sunAlignmentDates(90, TAMPA.lat, TAMPA.lng, TAMPA.tz, FROM)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].kind).toBe('sunrise')
    expect(hits[0].at.getUTCMonth()).toBe(8)
  })

  it('returns at most `count` hits, in date order, all within tolerance', () => {
    const hits = sunAlignmentDates(270, TAMPA.lat, TAMPA.lng, TAMPA.tz, FROM, { count: 5 })
    expect(hits.length).toBeLessThanOrEqual(5)
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i].at.getTime()).toBeGreaterThan(hits[i - 1].at.getTime())
    }
    for (const h of hits) expect(h.delta).toBeLessThanOrEqual(2)
  })

  it('facing north: the sun never sets there from Tampa', () => {
    expect(sunAlignmentDates(0, TAMPA.lat, TAMPA.lng, TAMPA.tz, FROM)).toEqual([])
  })

  it('a wider tolerance finds hits sooner than a narrow one', () => {
    const narrow = sunAlignmentDates(270, TAMPA.lat, TAMPA.lng, TAMPA.tz, FROM, { toleranceDeg: 1 })
    const wide = sunAlignmentDates(270, TAMPA.lat, TAMPA.lng, TAMPA.tz, FROM, { toleranceDeg: 8 })
    expect(wide[0].at.getTime()).toBeLessThanOrEqual(narrow[0].at.getTime())
  })
})
