import { computeSunTimes } from '../astro/sun-times'

export interface WeatherNow {
  tempF: number
  cloudCover: number
  humidity: number
  precipProb: number
  windMph: number
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

export async function fetchWeather(lat: number, lng: number, now = new Date()): Promise<WeatherNow> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,cloud_cover,precipitation_probability,weather_code,wind_speed_10m` +
    `&hourly=cloud_cover_low,cloud_cover_mid,cloud_cover_high,relative_humidity_2m` +
    `&daily=precipitation_probability_max,weather_code` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=6`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`weather ${res.status}`)
  const j = await res.json()

  const c = j.current
  const sunset = computeSunTimes(now, lat, lng).sunset
  const hourly = j.hourly
  let idx = 0
  if (hourly?.time?.length) {
    const target = sunset.getTime()
    let best = Infinity
    hourly.time.forEach((iso: string, i: number) => {
      const dt = Math.abs(new Date(iso).getTime() - target)
      if (dt < best) { best = dt; idx = i }
    })
  }

  return {
    tempF: Math.round(c.temperature_2m),
    cloudCover: c.cloud_cover,
    humidity: c.relative_humidity_2m,
    precipProb: c.precipitation_probability ?? 0,
    windMph: Math.round(c.wind_speed_10m),
    code: c.weather_code,
    sunsetLayers: {
      cloudLow: hourly?.cloud_cover_low?.[idx] ?? c.cloud_cover,
      cloudMid: hourly?.cloud_cover_mid?.[idx] ?? c.cloud_cover,
      cloudHigh: hourly?.cloud_cover_high?.[idx] ?? 0,
      humidity: hourly?.relative_humidity_2m?.[idx] ?? c.relative_humidity_2m,
    },
    daily: (j.daily?.time ?? []).slice(0, 6).map((d: string, i: number) => ({
      date: d,
      precipMax: j.daily.precipitation_probability_max?.[i] ?? 0,
      code: j.daily.weather_code?.[i] ?? 0,
    })),
  }
}
