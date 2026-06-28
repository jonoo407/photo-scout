import { describe, it, expect } from 'vitest'
import { parseMarineTides, lowTideMinutesNear } from '../../src/weather/tides'

const Z = 1_750_000_000
// A tide curve dipping to a low at index 2 (Z+7200), rising after.
const json = {
  hourly: {
    time: [Z, Z + 3600, Z + 7200, Z + 10800, Z + 14400],
    sea_level_height_msl: [0.8, 0.4, -0.2, 0.3, 0.7],
  },
}

describe('parseMarineTides', () => {
  it('parses the sea-level height series', () => {
    const s = parseMarineTides(json)
    expect(s.time).toHaveLength(5)
    expect(s.height[2]).toBe(-0.2)
  })
  it('returns empty arrays for a bad payload', () => {
    expect(parseMarineTides({})).toEqual({ time: [], height: [] })
  })
})

describe('lowTideMinutesNear', () => {
  const s = parseMarineTides(json)
  it('measures minutes to the nearest low-tide minimum', () => {
    expect(lowTideMinutesNear(s, new Date((Z + 7200) * 1000))).toBe(0) // at the low
    expect(lowTideMinutesNear(s, new Date((Z + 9000) * 1000))).toBe(30) // 30 min after the low
  })
  it('returns null when the series has no interior minimum', () => {
    const rising = parseMarineTides({ hourly: { time: [Z, Z + 3600, Z + 7200], sea_level_height_msl: [0.1, 0.2, 0.3] } })
    expect(lowTideMinutesNear(rising, new Date(Z * 1000))).toBeNull()
  })
})
