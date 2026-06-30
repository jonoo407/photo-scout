import { computeSunTimes, type SunTimes } from '../astro/sun-times'
import { sunPosition } from '../astro/sun-position'
import { moonInfo } from '../astro/moon'
import { resolveOpenStatus } from './hours'
import { getRegion } from '../data/regions'
import { zonedWallToInstant } from '../util/tz'
import type { Spot } from './types'

export type WindowKind = 'morning' | 'evening' | 'night' | 'daytime'

export interface DayInputs {
  skyScore?: number | null   // 0-100 cloud-based sky score at the window; null/undefined beyond the forecast horizon
  lowTideMin?: number | null // minutes from the window to the nearest low tide; null if no tide data
}

export interface BestDay {
  date: Date
  windowKind: WindowKind
  windowStart: Date
  score: number       // 0-100
  reasons: string[]
  open: boolean
  forecast: boolean   // a real weather forecast contributed to the score
}

/** The window a spot is primarily shot in (drives which light/tide/open check we use). */
export function primeWindow(spot: Spot): WindowKind {
  if (spot.category === 'interiors' || spot.category === 'gardens') return 'daytime'
  const primary = spot.bestLight[0]
  if (primary === 'evening-golden' || primary === 'sunset' || primary === 'blue-hour') return 'evening'
  if (primary === 'morning-golden' || primary === 'sunrise') return 'morning'
  if (primary === 'night-astro') return 'night'
  return 'daytime'
}

function windowTime(kind: WindowKind, t: SunTimes): Date {
  const mid = (w: { start: Date; end: Date }) => new Date((w.start.getTime() + w.end.getTime()) / 2)
  if (kind === 'evening') return mid(t.goldenHourEvening)
  if (kind === 'morning') return mid(t.goldenHourMorning)
  if (kind === 'night') return t.astronomicalDusk
  return t.solarNoon
}

/** The exact moment a spot's prime window peaks on a given day — for sampling sky/tide. */
export function windowTimeFor(spot: Spot, date: Date, lat: number, lng: number): Date {
  const tz = getRegion(spot.region).timeZone
  const day = zonedWallToInstant(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, tz)
  return windowTime(primeWindow(spot), computeSunTimes(day, lat, lng))
}

const angDist = (a: number, b: number) => { const d = (((a - b) % 360) + 360) % 360; return d > 180 ? 360 - d : d }
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

export function scoreBestDay(spot: Spot, date: Date, lat: number, lng: number, inputs: DayInputs = {}): BestDay {
  // Compute sun/moon from the spot's local noon so suncalc resolves THIS
  // calendar day's events in the spot's own timezone (not the device's).
  const tz = getRegion(spot.region).timeZone
  const day = zonedWallToInstant(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, tz)
  const t = computeSunTimes(day, lat, lng)
  const kind = primeWindow(spot)
  const wt = windowTime(kind, t)
  const sunTimesFor = (d: Date) => {
    const tt = computeSunTimes(new Date(d.getTime() + 12 * 3600 * 1000), lat, lng) // +12h → local noon
    return { sunrise: tt.sunrise, sunset: tt.sunset }
  }
  const open = resolveOpenStatus(spot.hours, wt, sunTimesFor, tz).state !== 'closed'

  if (!open) {
    return { date, windowKind: kind, windowStart: wt, score: 6, reasons: ['Closed at the prime window'], open: false, forecast: false }
  }

  const reasons: string[] = []
  let score = 45

  // Sun-subject alignment — the "henge" factor, only when the sun is the backdrop.
  if (spot.facing != null && (kind === 'evening' || kind === 'morning')) {
    const sun = sunPosition(wt, lat, lng)
    if (sun.elevation > -2) {
      const align = clamp(1 - angDist(sun.azimuth, spot.facing) / 40, 0, 1)
      score += align * 25
      if (align >= 0.6) reasons.push('Sun lines up behind the subject')
    }
  }

  // Sky (forecast). Beyond the forecast horizon skyScore is null → no contribution.
  let forecast = false
  if (inputs.skyScore != null) {
    forecast = true
    score += ((inputs.skyScore - 50) / 100) * 30 // -15..+15
    if (inputs.skyScore >= 70) reasons.push(`Strong ${kind === 'morning' ? 'sunrise' : 'sunset'} sky (${inputs.skyScore})`)
  }

  // Moon
  const moon = moonInfo(day, lat, lng)
  if (kind === 'night') {
    score += (1 - moon.illumination / 100) * 20
    if (moon.illumination <= 10) reasons.push('New moon — dark skies')
  } else if (kind === 'evening' && moon.illumination >= 90 && moon.rise) {
    const dm = Math.abs(moon.rise.getTime() - t.blueHourEvening.end.getTime()) / 60000
    if (dm <= 90) { score += 10; reasons.push('Full moon rises at blue hour') }
  }

  // Tide (coastal spots only — caller passes lowTideMin from NOAA)
  if (inputs.lowTideMin != null) {
    score += clamp(1 - inputs.lowTideMin / 90, 0, 1) * 20
    if (inputs.lowTideMin <= 60) reasons.push('Low tide near golden hour')
  }

  return { date, windowKind: kind, windowStart: wt, score: Math.round(clamp(score, 0, 100)), reasons, open: true, forecast }
}

export function rankBestDays(
  spot: Spot, dates: Date[], lat: number, lng: number, inputsFor?: (d: Date) => DayInputs,
): BestDay[] {
  return dates
    .map((d) => scoreBestDay(spot, d, lat, lng, inputsFor?.(d) ?? {}))
    .sort((a, b) => b.score - a.score)
}
