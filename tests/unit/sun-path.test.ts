import { describe, it, expect } from 'vitest'
import { destPoint, sunPathLines } from '../../src/astro/sun-path'

const TAMPA = { lat: 27.94, lng: -82.55 }
// Local noon in Tampa (EDT) pins each computation to the intended civil day.
const SOLSTICE_SUMMER = new Date('2026-06-21T16:00:00Z')
const SOLSTICE_WINTER = new Date('2026-12-21T17:00:00Z')

describe('destPoint', () => {
  it('heads due north ~1° of latitude per 111.2 km', () => {
    const p = destPoint(0, 0, 0, 111_195)
    expect(p.lat).toBeCloseTo(1, 2)
    expect(p.lng).toBeCloseTo(0, 5)
  })

  it('heads due east from Tampa: longitude grows, latitude holds', () => {
    const p = destPoint(TAMPA.lat, TAMPA.lng, 90, 10_000)
    expect(p.lng).toBeGreaterThan(TAMPA.lng)
    expect(p.lat).toBeCloseTo(TAMPA.lat, 2)
  })
})

describe('sunPathLines', () => {
  it('summer solstice in Tampa: sunrise well north of east, sunset well north of west', () => {
    const { sunrise, sunset } = sunPathLines(TAMPA.lat, TAMPA.lng, SOLSTICE_SUMMER)
    expect(sunrise!.bearing).toBeGreaterThan(58)
    expect(sunrise!.bearing).toBeLessThan(68)
    expect(sunset!.bearing).toBeGreaterThan(292)
    expect(sunset!.bearing).toBeLessThan(302)
  })

  it('winter solstice in Tampa: sunrise south of east, sunset south of west', () => {
    const { sunrise, sunset } = sunPathLines(TAMPA.lat, TAMPA.lng, SOLSTICE_WINTER)
    expect(sunrise!.bearing).toBeGreaterThan(112)
    expect(sunrise!.bearing).toBeLessThan(122)
    expect(sunset!.bearing).toBeGreaterThan(238)
    expect(sunset!.bearing).toBeLessThan(248)
  })

  it('line endpoints sit away from the spot in the bearing direction', () => {
    const { sunrise } = sunPathLines(TAMPA.lat, TAMPA.lng, SOLSTICE_SUMMER, 1500)
    // summer sunrise bearing ~63° → endpoint north-east of the spot
    expect(sunrise!.to.lat).toBeGreaterThan(TAMPA.lat)
    expect(sunrise!.to.lng).toBeGreaterThan(TAMPA.lng)
  })

  it('polar night: no lines when the sun never rises', () => {
    const { sunrise, sunset } = sunPathLines(80, 0, new Date('2026-12-21T12:00:00Z'))
    expect(sunrise).toBeNull()
    expect(sunset).toBeNull()
  })
})
