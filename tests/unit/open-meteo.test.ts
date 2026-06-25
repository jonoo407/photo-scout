import { describe, it, expect } from 'vitest'
import { parseWeather } from '../../src/weather/open-meteo'

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
