import { describe, it, expect } from 'vitest'
import { parseWeather, parseHourlyConditions, parseSkyHourly, skyScoreAt } from '../../src/weather/open-meteo'

// Fixed instant so the test is deterministic (no Date.now()).
const SUNSET = new Date(1_750_000_000_000)
const S = 1_750_000_000 // seconds

function fixture(over: Record<string, unknown> = {}) {
  return {
    current: {
      temperature_2m: 92.4, cloud_cover: 40, relative_humidity_2m: 60,
      precipitation_probability: null, weather_code: 2, wind_speed_10m: 7.6,
    },
    hourly: {
      time: [S - 7200, S - 600, S + 3600], // unixtime seconds; index 1 is nearest sunset
      cloud_cover_low: [5, 10, 80],
      cloud_cover_mid: [20, 55, 90],
      cloud_cover_high: [30, 60, 5],
      relative_humidity_2m: [50, 55, 70],
    },
    daily: { time: [S - 43200], precipitation_probability_max: [80], weather_code: [3] },
    ...over,
  }
}

describe('parseWeather', () => {
  it('picks the hourly cloud layers nearest sunset (unixtime, timezone-safe)', () => {
    const w = parseWeather(fixture(), SUNSET, 'imperial')
    expect(w.sunsetLayers).toMatchObject({ cloudLow: 10, cloudMid: 55, cloudHigh: 60, humidity: 55 })
  })

  it('rounds temperature and labels the unit per the requested system', () => {
    expect(parseWeather(fixture(), SUNSET, 'imperial')).toMatchObject({ temp: 92, unit: '°F', windUnit: 'mph' })
    expect(parseWeather(fixture(), SUNSET, 'metric')).toMatchObject({ unit: '°C', windUnit: 'km/h' })
  })

  it('falls back to the daily precip max when current precip is missing', () => {
    // current.precipitation_probability is null in the fixture → use daily max 80
    expect(parseWeather(fixture(), SUNSET).precipProb).toBe(80)
  })

  it('returns temp null (not NaN) when the current block is empty', () => {
    const w = parseWeather({ current: {}, hourly: {}, daily: {} }, SUNSET)
    expect(w.temp).toBeNull()
    expect(Number.isNaN(w.cloudCover)).toBe(false)
  })
})

describe('parseHourlyConditions', () => {
  const Z = 1_750_000_000
  const j = { hourly: { time: [Z - 3600, Z, Z + 3600], precipitation_probability: [10, 80, 30], cloud_cover: [20, 90, 40] } }

  it('samples the nearest hour for each block time', () => {
    const res = parseHourlyConditions(j, [new Date(Z * 1000), new Date((Z + 3400) * 1000)])
    expect(res[0]).toEqual({ precipProb: 80, cloudCover: 90 })
    expect(res[1]).toEqual({ precipProb: 30, cloudCover: 40 })
  })

  it('falls back to zero when hourly data is missing', () => {
    expect(parseHourlyConditions({}, [new Date(Z * 1000)])[0]).toEqual({ precipProb: 0, cloudCover: 0 })
  })
})

describe('skyScoreAt (per-day forecast sky)', () => {
  const Z = 1_750_000_000
  const sky = parseSkyHourly({ hourly: { time: [Z], cloud_cover_low: [5], cloud_cover_mid: [40], cloud_cover_high: [30], relative_humidity_2m: [50] } })

  it('scores a good mid/high-cloud sky high at the nearest forecast hour', () => {
    expect(skyScoreAt(sky, new Date(Z * 1000))!).toBeGreaterThan(80)
  })

  it('returns null past the forecast horizon (nearest hour too far)', () => {
    expect(skyScoreAt(sky, new Date((Z + 20 * 24 * 3600) * 1000))).toBeNull()
  })
})
