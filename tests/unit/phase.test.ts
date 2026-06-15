import { describe, it, expect } from 'vitest'
import { detectPhase } from '../../src/astro/phase'
import { computeSunTimes } from '../../src/astro/sun-times'

const LAT = 27.9477
const LNG = -82.4584
const DATE = new Date('2026-06-14T17:00:00Z')
const t = computeSunTimes(DATE, LAT, LNG)
const mid = (w: { start: Date; end: Date }) => new Date((w.start.getTime() + w.end.getTime()) / 2)

describe('detectPhase', () => {
  it('is day at solar noon', () => {
    expect(detectPhase(t.solarNoon, LAT, LNG)).toBe('day')
  })
  it('is morning-golden at sunrise (rising, elevation > -4)', () => {
    expect(detectPhase(t.sunrise, LAT, LNG)).toBe('morning-golden')
  })
  it('is morning-blue mid morning blue hour', () => {
    expect(detectPhase(mid(t.blueHourMorning), LAT, LNG)).toBe('morning-blue')
  })
  it('is evening-golden mid evening golden hour', () => {
    expect(detectPhase(mid(t.goldenHourEvening), LAT, LNG)).toBe('evening-golden')
  })
  it('is evening-blue mid evening blue hour', () => {
    expect(detectPhase(mid(t.blueHourEvening), LAT, LNG)).toBe('evening-blue')
  })
  it('is night well after astronomical dusk', () => {
    const deepNight = new Date(t.solarNoon.getTime() + 12 * 3600 * 1000)
    expect(detectPhase(deepNight, LAT, LNG)).toBe('night')
  })
})
