import { describe, it, expect } from 'vitest'
import SunCalc from 'suncalc'
import { computeSunTimes } from '../../src/astro/sun-times'

// Fixed, deterministic fixture: Tampa, FL on 2026-06-14 (noon UTC anchor).
const LAT = 27.9477
const LNG = -82.4584
const DATE = new Date('2026-06-14T17:00:00Z')

function altDeg(d: Date): number {
  return (SunCalc.getPosition(d, LAT, LNG).altitude * 180) / Math.PI
}

// suncalc's getTimes angle model and getPosition differ by a consistent ~0.2 deg,
// so we assert the boundary altitude is within 0.35 deg of the PhotoPills target.
// That still cleanly separates -0.833 / -4 / -6 / +6 (all >=2 deg apart).
function expectAngle(d: Date, target: number) {
  expect(Math.abs(altDeg(d) - target)).toBeLessThan(0.35)
}

describe('computeSunTimes — PhotoPills angle parity', () => {
  const t = computeSunTimes(DATE, LAT, LNG)

  it('sunrise/sunset sit at the -0.833 deg refraction boundary', () => {
    expectAngle(t.sunrise, -0.833)
    expectAngle(t.sunset, -0.833)
  })

  it('golden hour spans +6 deg down to -4 deg (PhotoPills)', () => {
    expectAngle(t.goldenHourMorning.start, -4)
    expectAngle(t.goldenHourMorning.end, 6)
    expectAngle(t.goldenHourEvening.start, 6)
    expectAngle(t.goldenHourEvening.end, -4)
  })

  it('blue hour spans -4 deg down to -6 deg (PhotoPills)', () => {
    expectAngle(t.blueHourMorning.start, -6)
    expectAngle(t.blueHourMorning.end, -4)
    expectAngle(t.blueHourEvening.start, -4)
    expectAngle(t.blueHourEvening.end, -6)
  })

  it('orders the morning sequence correctly', () => {
    const seq = [
      t.astronomicalDawn, t.nauticalDawn, t.blueHourMorning.start,
      t.goldenHourMorning.start, t.sunrise, t.goldenHourMorning.end, t.solarNoon,
    ].map((d) => d.getTime())
    const sorted = [...seq].sort((a, b) => a - b)
    expect(seq).toEqual(sorted)
  })

  it('orders the evening sequence correctly', () => {
    const seq = [
      t.solarNoon, t.goldenHourEvening.start, t.sunset, t.goldenHourEvening.end,
      t.blueHourEvening.end, t.nauticalDusk, t.astronomicalDusk,
    ].map((d) => d.getTime())
    const sorted = [...seq].sort((a, b) => a - b)
    expect(seq).toEqual(sorted)
  })

  it('golden hour morning contains sunrise; evening contains sunset', () => {
    expect(t.goldenHourMorning.start.getTime()).toBeLessThan(t.sunrise.getTime())
    expect(t.sunrise.getTime()).toBeLessThan(t.goldenHourMorning.end.getTime())
    expect(t.goldenHourEvening.start.getTime()).toBeLessThan(t.sunset.getTime())
    expect(t.sunset.getTime()).toBeLessThan(t.goldenHourEvening.end.getTime())
  })
})

/* The app anchors per-day sun lookups at "local midnight + 12h" (see
   sunTimesFor in best-days.ts / day-plan.ts). On DST-transition days that
   anchor lands at 11:00 or 13:00 wall time instead of noon — which is still
   safely inside the same local day, so suncalc must resolve the SAME day's
   events. Pins the behavior so nobody "fixes" the +12h into a DST bug. */
describe('midnight+12h day anchor survives DST transitions', () => {
  const dayInET = (d: Date) =>
    +new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', day: '2-digit' })
      .formatToParts(d).find((p) => p.type === 'day')!.value

  const cases: [string, number, number][] = [
    // [label, ET-midnight as UTC ms, expected local day]
    ['spring forward 2026-03-08', Date.UTC(2026, 2, 8, 5, 0), 8], // 00:00 EST
    ['fall back 2026-11-01', Date.UTC(2026, 10, 1, 4, 0), 1],     // 00:00 EDT
  ]

  for (const [label, midnightUtc, day] of cases) {
    it(label, () => {
      const t = computeSunTimes(new Date(midnightUtc + 12 * 3600 * 1000), LAT, LNG)
      expect(dayInET(t.sunrise)).toBe(day)
      expect(dayInET(t.sunset)).toBe(day)
      expect(t.sunrise.getTime()).toBeLessThan(t.sunset.getTime())
    })
  }
})
