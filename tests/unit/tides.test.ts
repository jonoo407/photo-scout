import { describe, it, expect } from 'vitest'
import { parseTidePredictions, lowTideMinutesNear } from '../../src/weather/tides'

const fixture = {
  predictions: [
    { t: '2026-09-22 04:10', type: 'L', v: '0.21' },
    { t: '2026-09-22 10:30', type: 'H', v: '2.40' },
    { t: '2026-09-22 18:50', type: 'L', v: '-0.10' },
    { t: '2026-09-22 23:55', type: 'H', v: '1.90' },
  ],
}

describe('parseTidePredictions', () => {
  it('parses NOAA hi/lo predictions into typed points', () => {
    const p = parseTidePredictions(fixture)
    expect(p).toHaveLength(4)
    expect(p[0]).toMatchObject({ type: 'L', height: 0.21 })
    expect(p[0].t.getHours()).toBe(4)
  })

  it('returns [] for an error / empty payload', () => {
    expect(parseTidePredictions({ error: { message: 'bad station' } })).toEqual([])
    expect(parseTidePredictions({})).toEqual([])
  })
})

describe('lowTideMinutesNear', () => {
  it('returns minutes to the nearest LOW tide', () => {
    const p = parseTidePredictions(fixture)
    const window = new Date(2026, 8, 22, 19, 20) // 7:20pm — near the 6:50pm low
    expect(lowTideMinutesNear(p, window)).toBe(30)
  })

  it('returns null when there are no low tides', () => {
    const highsOnly = parseTidePredictions({ predictions: [{ t: '2026-09-22 10:30', type: 'H', v: '2.4' }] })
    expect(lowTideMinutesNear(highsOnly, new Date(2026, 8, 22, 19, 20))).toBeNull()
  })
})
