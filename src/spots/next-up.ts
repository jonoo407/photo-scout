import { computeSunTimes } from '../astro/sun-times'
import { sunPosition } from '../astro/sun-position'
import { classifyLightDirection } from '../astro/sun-direction'
import { resolveOpenStatus, type OpenStatus } from './hours'
import { haversineMiles } from './distance'
import { getRegion } from '../data/regions'
import type { Spot, Light } from './types'
import type { HomeLocation } from '../data/home.config'
import type { WeatherVerdict } from '../weather/verdict'

export type WindowKind = 'morning-blue' | 'morning-golden' | 'evening-golden' | 'evening-blue'

export interface ShootingWindow {
  kind: WindowKind
  light: Light
  label: string
  start: Date
  end: Date
}

export type Verdict = 'go' | 'maybe' | 'skip'

export interface RankedSpot {
  spot: Spot
  score: number
  verdict: Verdict
  reason: string
  driveMinutes: number
  open: OpenStatus
}

export interface NextUpResult {
  window: ShootingWindow
  ranked: RankedSpot[]
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

function windowsForDate(date: Date, lat: number, lng: number): ShootingWindow[] {
  const t = computeSunTimes(date, lat, lng)
  return [
    { kind: 'morning-blue', light: 'blue-hour', label: 'Morning blue hour', start: t.blueHourMorning.start, end: t.blueHourMorning.end },
    { kind: 'morning-golden', light: 'morning-golden', label: 'Morning golden hour', start: t.goldenHourMorning.start, end: t.goldenHourMorning.end },
    { kind: 'evening-golden', light: 'evening-golden', label: 'Evening golden hour', start: t.goldenHourEvening.start, end: t.goldenHourEvening.end },
    { kind: 'evening-blue', light: 'blue-hour', label: 'Evening blue hour', start: t.blueHourEvening.start, end: t.blueHourEvening.end },
  ]
}

function nextWindow(now: Date, lat: number, lng: number): ShootingWindow {
  const today = windowsForDate(now, lat, lng)
  const upcoming = today.find((w) => w.end.getTime() > now.getTime())
  if (upcoming) return upcoming
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000)
  return windowsForDate(tomorrow, lat, lng)[0]
}

export function matchesLight(spot: Spot, light: Light): boolean {
  const tags = spot.bestLight
  if (light === 'evening-golden') return tags.includes('evening-golden') || tags.includes('sunset')
  if (light === 'morning-golden') return tags.includes('morning-golden') || tags.includes('sunrise')
  if (light === 'blue-hour') return tags.includes('blue-hour')
  return tags.includes(light)
}

const DRAMATIC = new Set(['skyline', 'beach', 'rooftop'])

export interface NextUpInput {
  now: Date
  lat: number
  lng: number
  home: HomeLocation
  spots: Spot[]
  wishlist?: Set<string>
  verdict?: WeatherVerdict
}

export function nextUp({ now, lat, lng, home, spots, wishlist, verdict }: NextUpInput): NextUpResult {
  const window = nextWindow(now, lat, lng)
  const repTime = new Date((window.start.getTime() + window.end.getTime()) / 2)
  const sun = sunPosition(repTime, lat, lng)
  const sunTimesFor = (d: Date) => {
    const tt = computeSunTimes(d, lat, lng)
    return { sunrise: tt.sunrise, sunset: tt.sunset }
  }

  const ranked: RankedSpot[] = []
  for (const spot of spots) {
    const open = resolveOpenStatus(spot.hours, window.start, sunTimesFor, getRegion(spot.region).timeZone)
    if (open.state === 'closed') continue

    let score = 0
    let reason: string

    if (spot.facing != null && sun.elevation > 0) {
      const dir = classifyLightDirection(sun.azimuth, spot.facing, sun.elevation)
      const dramatic = DRAMATIC.has(spot.category)
      if (dir === 'silhouette') {
        score += dramatic ? 1.0 : 0.55
        reason = dramatic ? 'Dramatic silhouette' : 'Backlit silhouette'
      } else if (dir === 'front') {
        score += 0.9
        reason = 'Front-lit'
      } else if (dir === 'side') {
        score += 0.72
        reason = 'Side-lit'
      } else {
        score += 0.5
        reason = 'Backlit rim light'
      }
      // Light-tag kicker on top of the direction score. Only in this branch —
      // the no-facing branch's base score IS the tag match; adding it again
      // would double-count one signal and inflate unverifiable spots.
      if (matchesLight(spot, window.light)) score += 0.1
    } else {
      const match = matchesLight(spot, window.light)
      score += match ? 0.85 : 0.5
      reason = match ? `Great in ${window.label.toLowerCase()}` : 'Workable light'
    }
    if (verdict) {
      if (verdict.favors.includes(spot.category)) score += 0.15
      if (verdict.avoid.includes(spot.category)) score -= 0.3
    }

    const miles = haversineMiles(home, spot)
    score += clamp(1 - miles / 60, 0, 1) * 0.1
    if (open.state === 'tour-only' || open.state === 'call-ahead') {
      score -= 0.25
      reason = open.state === 'tour-only' ? 'Tour only' : 'Call ahead'
    }
    if (wishlist?.has(spot.id)) score += 0.2

    const verdictLabel: Verdict = score >= 0.9 ? 'go' : score >= 0.65 ? 'maybe' : 'skip'
    const driveMinutes = Math.round(miles * 2.2) // from the actual home, not a stored constant
    ranked.push({ spot, score: Math.round(score * 1000) / 1000, verdict: verdictLabel, reason, driveMinutes, open })
  }

  ranked.sort((a, b) => b.score - a.score)
  return { window, ranked }
}
