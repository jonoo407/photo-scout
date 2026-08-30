import { describe, it, expect } from 'vitest'
import { parseWeather, parseHourlyConditions, parseSkyHourly, skyScoreAt } from '../../src/weather/open-meteo'

/* parseWeather is written defensively throughout — `fin(x, fallback)`, `?? []`,
   a nearest-hour search that tolerates an empty time array. Only the happy
   shape was ever tested, so none of those fallbacks was proven to work. Every
   planning surface in the app reads this function's output, and Open-Meteo
   returning a partial `current` block is an ordinary Tuesday. */

const SUNSET = new Date(2026, 5, 30, 20, 30)

describe('parseWeather with degenerate payloads', () => {
  it('survives null, undefined and a non-object', () => {
    for (const junk of [null, undefined, 42, 'nope', []]) {
      const w = parseWeather(junk, SUNSET)
      expect(w.temp).toBeNull()
      expect(w.cloudCover).toBe(0)
      expect(w.daily).toEqual([])
      expect(Number.isFinite(w.wind)).toBe(true)
    }
  })

  it('reports temp as null rather than 0 when the API omits it', () => {
    // 0 °F is a real reading; null is "we do not know". Collapsing them would
    // put a confident wrong number on the Today card.
    expect(parseWeather({ current: {} }, SUNSET).temp).toBeNull()
    expect(parseWeather({ current: { temperature_2m: null } }, SUNSET).temp).toBeNull()
    expect(parseWeather({ current: { temperature_2m: 'warm' } }, SUNSET).temp).toBeNull()
    expect(parseWeather({ current: { temperature_2m: NaN } }, SUNSET).temp).toBeNull()
    expect(parseWeather({ current: { temperature_2m: 0 } }, SUNSET).temp).toBe(0)
    expect(parseWeather({ current: { temperature_2m: 71.6 } }, SUNSET).temp).toBe(72)
  })

  it('falls back to today\'s daily max when current precip probability is null', () => {
    const w = parseWeather({
      current: { precipitation_probability: null },
      daily: { time: [1782000000], precipitation_probability_max: [70] },
    }, SUNSET)
    expect(w.precipProb).toBe(70)
  })

  it('uses the current probability when it is a real number, including 0', () => {
    const w = parseWeather({
      current: { precipitation_probability: 0 },
      daily: { time: [1782000000], precipitation_probability_max: [70] },
    }, SUNSET)
    expect(w.precipProb).toBe(0)
  })

  it('falls back to current cloud for the sunset layers when hourly is missing', () => {
    const w = parseWeather({ current: { cloud_cover: 45, relative_humidity_2m: 80 } }, SUNSET)
    expect(w.sunsetLayers.cloudLow).toBe(45)
    expect(w.sunsetLayers.cloudMid).toBe(45)
    expect(w.sunsetLayers.cloudHigh).toBe(0) // high cloud has no sensible stand-in
    expect(w.sunsetLayers.humidity).toBe(80)
  })

  it('picks the hourly index nearest the sunset instant, not index 0', () => {
    const hour = (h: number) => Math.floor(new Date(2026, 5, 30, h, 0).getTime() / 1000)
    const w = parseWeather({
      current: {},
      hourly: {
        time: [hour(6), hour(12), hour(20), hour(23)],
        cloud_cover_low: [1, 2, 3, 4],
        cloud_cover_mid: [10, 20, 30, 40],
        cloud_cover_high: [11, 21, 31, 41],
        relative_humidity_2m: [50, 60, 70, 80],
      },
    }, SUNSET)
    expect(w.sunsetLayers.cloudLow).toBe(3) // the 20:00 row
    expect(w.sunsetLayers.cloudMid).toBe(30)
  })

  it('accepts ISO hourly timestamps as well as unixtime', () => {
    const w = parseWeather({
      current: {},
      hourly: {
        time: ['2026-06-30T06:00', '2026-06-30T20:00'],
        cloud_cover_low: [1, 99],
      },
    }, SUNSET)
    expect(w.sunsetLayers.cloudLow).toBe(99)
  })

  it('does not walk off the end of a short hourly array', () => {
    const w = parseWeather({
      current: { cloud_cover: 12 },
      hourly: { time: [1, 2, 3], cloud_cover_low: [7] }, // ragged: shorter than time
    }, SUNSET)
    expect(Number.isFinite(w.sunsetLayers.cloudLow)).toBe(true)
  })

  it('caps the daily forecast at six days and tolerates missing columns', () => {
    const w = parseWeather({
      current: {},
      daily: { time: Array.from({ length: 16 }, (_, i) => 1782000000 + i * 86400) },
    }, SUNSET)
    expect(w.daily).toHaveLength(6)
    expect(w.daily[0].precipMax).toBe(0)
    expect(w.daily[0].code).toBe(0)
    expect(w.daily[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('keeps a string daily date as given', () => {
    const w = parseWeather({ current: {}, daily: { time: ['2026-06-30'] } }, SUNSET)
    expect(w.daily[0].date).toBe('2026-06-30')
  })

  it('switches units without touching the numbers', () => {
    const imperial = parseWeather({ current: { temperature_2m: 20, wind_speed_10m: 9.4 } }, SUNSET, 'imperial')
    const metric = parseWeather({ current: { temperature_2m: 20, wind_speed_10m: 9.4 } }, SUNSET, 'metric')
    expect([imperial.unit, imperial.windUnit]).toEqual(['°F', 'mph'])
    expect([metric.unit, metric.windUnit]).toEqual(['°C', 'km/h'])
    expect(metric.temp).toBe(imperial.temp) // conversion happens upstream, not here
    expect(imperial.wind).toBe(9)
  })
})

describe('parseHourlyConditions with degenerate payloads', () => {
  const times = [new Date(2026, 5, 30, 7, 0), new Date(2026, 5, 30, 19, 0)]

  it('returns a zeroed block per requested time when there is no hourly data', () => {
    for (const junk of [null, {}, { hourly: {} }, { hourly: { time: [] } }]) {
      expect(parseHourlyConditions(junk, times)).toEqual([
        { precipProb: 0, cloudCover: 0 }, { precipProb: 0, cloudCover: 0 },
      ])
    }
  })

  it('samples the nearest hour for each block', () => {
    const hour = (h: number) => Math.floor(new Date(2026, 5, 30, h, 0).getTime() / 1000)
    const out = parseHourlyConditions({
      hourly: {
        time: [hour(6), hour(12), hour(19)],
        precipitation_probability: [10, 50, 90],
        cloud_cover: [5, 55, 95],
      },
    }, times)
    expect(out[0]).toEqual({ precipProb: 10, cloudCover: 5 })
    expect(out[1]).toEqual({ precipProb: 90, cloudCover: 95 })
  })

  it('returns an empty list for no requested times', () => {
    expect(parseHourlyConditions({ hourly: { time: [1] } }, [])).toEqual([])
  })
})

describe('parseSkyHourly / skyScoreAt with degenerate payloads', () => {
  it('parses to empty arrays for junk rather than throwing', () => {
    for (const junk of [null, undefined, {}, { hourly: null }]) {
      const s = parseSkyHourly(junk)
      expect(s.time).toEqual([])
    }
  })

  it('scores null when there is nothing to score', () => {
    expect(skyScoreAt(parseSkyHourly(null), new Date())).toBeNull()
  })
})
