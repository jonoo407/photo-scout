import { describe, it, expect } from 'vitest'
import { signedDelta, headingFromEvent, sunTarget } from '../../src/spots/compass'
import type { Spot } from '../../src/spots/types'

describe('signedDelta', () => {
  it('turns the short way across north', () => {
    expect(signedDelta(350, 10)).toBe(20)
    expect(signedDelta(10, 350)).toBe(-20)
  })
  it('is zero when aligned and 180 for an about-face', () => {
    expect(signedDelta(90, 90)).toBe(0)
    expect(Math.abs(signedDelta(0, 180))).toBe(180)
  })
})

describe('headingFromEvent', () => {
  it('prefers iOS webkitCompassHeading (already compass degrees)', () => {
    expect(headingFromEvent({ webkitCompassHeading: 45, alpha: 999 })).toBe(45)
  })
  it('derives heading from absolute alpha on Android (alpha counts CCW)', () => {
    expect(headingFromEvent({ alpha: 90, absolute: true })).toBe(270)
    expect(headingFromEvent({ alpha: 0, absolute: true })).toBe(0)
  })
  it('returns null without a usable reading', () => {
    expect(headingFromEvent({ alpha: null })).toBeNull()
    expect(headingFromEvent({ alpha: 90, absolute: false })).toBeNull()
  })
})

describe('sunTarget', () => {
  const spot = {
    id: 'x', name: 'X', lat: 27.94, lng: -82.55, region: 'tampa-bay',
    category: 'beach', bestLight: ['sunset'],
  } as unknown as Spot

  it('targets the sun azimuth at the spot\'s prime window (sunset spot → westward)', () => {
    const t = sunTarget(spot, new Date('2026-06-15T16:00:00Z'))
    expect(t.bearing).toBeGreaterThan(240)
    expect(t.bearing).toBeLessThan(320)
    expect(t.at).toBeInstanceOf(Date)
    expect(t.daysAhead).toBe(0)
  })

  it('never points at a window that already passed — rolls to tomorrow', () => {
    // A sunrise spot at 4 PM: this morning's golden hour is long gone, so the
    // arrow must aim at TOMORROW's sunrise, not where the sun was at dawn.
    const morningSpot = {
      ...(spot as object), bestLight: ['sunrise'],
    } as unknown as Spot
    const afternoon = new Date('2026-06-15T20:00:00Z') // 4 PM EDT
    const t = sunTarget(morningSpot, afternoon)
    expect(t.at.getTime()).toBeGreaterThan(afternoon.getTime())
    expect(t.daysAhead).toBe(1)
    expect(t.bearing).toBeGreaterThan(50) // sunrise-ish, east side
    expect(t.bearing).toBeLessThan(130)
  })
})
