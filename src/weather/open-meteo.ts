import { computeSunTimes } from '../astro/sun-times'

export type Units = 'imperial' | 'metric'

export interface WeatherNow {
  temp: number | null // null when the API omits the current temperature
  unit: '°F' | '°C'
  cloudCover: number
  humidity: number
  precipProb: number
  wind: number
  windUnit: 'mph' | 'km/h'
  code: number
  sunsetLayers: { cloudLow: number; cloudMid: number; cloudHigh: number; humidity: number }
  daily: { date: string; precipMax: number; code: number }[]
}

export function weatherText(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code === 45 || code === 48) return 'Fog'
  if (code >= 51 && code <= 67) return 'Drizzle / rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code >= 95) return 'Thunderstorm'
  return 'Mixed'
}

const fin = (x: unknown, fallback: number): number =>
  typeof x === 'number' && Number.isFinite(x) ? x : fallback

/* Open-Meteo time arrays are requested as unixtime (seconds, UTC) so the
   nearest-sunset hour is selected by comparing true instants — this is correct
   regardless of the device timezone. A bare ISO string would be parsed as
   browser-local and silently pick the wrong hour off-zone. */
function hourMs(t: unknown): number {
  if (typeof t === 'number') return t * 1000
  return new Date(String(t)).getTime()
}

export function parseWeather(j: unknown, sunset: Date, units: Units = 'imperial'): WeatherNow {
  const root = (j ?? {}) as Record<string, any>
  const c = (root.current ?? {}) as Record<string, unknown>
  const hourly = root.hourly as Record<string, unknown[]> | undefined

  let idx = 0
  const times = hourly?.time
  if (Array.isArray(times) && times.length) {
    const target = sunset.getTime()
    let best = Infinity
    times.forEach((t, i) => {
      const dt = Math.abs(hourMs(t) - target)
      if (Number.isFinite(dt) && dt < best) { best = dt; idx = i }
    })
  }

  const dailyTime: unknown[] = (root.daily?.time as unknown[]) ?? []
  const daily = dailyTime.slice(0, 6).map((t, i) => ({
    date: typeof t === 'number' ? new Date(t * 1000).toISOString().slice(0, 10) : String(t),
    precipMax: fin(root.daily?.precipitation_probability_max?.[i], 0),
    code: fin(root.daily?.weather_code?.[i], 0),
  }))

  const tempRaw = c.temperature_2m
  const currentCloud = fin(c.cloud_cover, 0)
  const currentPrecip = c.precipitation_probability

  return {
    temp: typeof tempRaw === 'number' && Number.isFinite(tempRaw) ? Math.round(tempRaw) : null,
    unit: units === 'metric' ? '°C' : '°F',
    cloudCover: currentCloud,
    humidity: fin(c.relative_humidity_2m, 0),
    // current.precipitation_probability is frequently null in Open-Meteo's
    // `current` block — fall back to today's daily max so the rain path works.
    precipProb: typeof currentPrecip === 'number' && Number.isFinite(currentPrecip)
      ? currentPrecip
      : (daily[0]?.precipMax ?? 0),
    wind: Math.round(fin(c.wind_speed_10m, 0)),
    windUnit: units === 'metric' ? 'km/h' : 'mph',
    code: fin(c.weather_code, 0),
    sunsetLayers: {
      cloudLow: fin(hourly?.cloud_cover_low?.[idx], currentCloud),
      cloudMid: fin(hourly?.cloud_cover_mid?.[idx], currentCloud),
      cloudHigh: fin(hourly?.cloud_cover_high?.[idx], 0),
      humidity: fin(hourly?.relative_humidity_2m?.[idx], fin(c.relative_humidity_2m, 0)),
    },
    daily,
  }
}

export interface BlockConditions { precipProb: number; cloudCover: number }

/* Sample hourly precip + cloud at each given moment (nearest hour). Used to
   give the day planner per-block (morning/midday/evening) weather. */
export function parseHourlyConditions(j: unknown, times: Date[]): BlockConditions[] {
  const h = ((j ?? {}) as Record<string, any>).hourly ?? {}
  const ts: unknown[] = Array.isArray(h.time) ? h.time : []
  const ms = ts.map(hourMs)
  return times.map((t) => {
    if (!ms.length) return { precipProb: 0, cloudCover: 0 }
    const target = t.getTime()
    let best = 0, bestD = Infinity
    ms.forEach((m, i) => { const d = Math.abs(m - target); if (Number.isFinite(d) && d < bestD) { bestD = d; best = i } })
    return { precipProb: fin(h.precipitation_probability?.[best], 0), cloudCover: fin(h.cloud_cover?.[best], 0) }
  })
}

export async function fetchBlockConditions(
  lat: number, lng: number, times: Date[], fetchImpl: typeof fetch = fetch,
): Promise<BlockConditions[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&hourly=precipitation_probability,cloud_cover&timeformat=unixtime&timezone=auto&forecast_days=3`
  const res = await fetchImpl(url)
  if (!res.ok) throw new Error(`weather ${res.status}`)
  return parseHourlyConditions(await res.json(), times)
}

export async function fetchWeather(
  lat: number, lng: number, now = new Date(), units: Units = 'imperial',
): Promise<WeatherNow> {
  const tempUnit = units === 'metric' ? 'celsius' : 'fahrenheit'
  const windUnit = units === 'metric' ? 'kmh' : 'mph'
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,cloud_cover,precipitation_probability,weather_code,wind_speed_10m` +
    `&hourly=cloud_cover_low,cloud_cover_mid,cloud_cover_high,relative_humidity_2m` +
    `&daily=precipitation_probability_max,weather_code` +
    `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timeformat=unixtime&timezone=auto&forecast_days=6`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`weather ${res.status}`)
  const j = await res.json()
  const sunset = computeSunTimes(now, lat, lng).sunset
  return parseWeather(j, sunset, units)
}
