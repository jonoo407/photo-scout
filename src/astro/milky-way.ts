import SunCalc from 'suncalc'
import { moonInfo } from './moon'
import { zonedWallToInstant, zoneParts } from '../util/tz'

/* Galactic center (Sagittarius A*), J2000: RA 17h 45m 40s, Dec −29° 0′ 28″. */
const CORE_RA_DEG = 266.4168
const CORE_DEC_DEG = -29.0078

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

/** Greenwich mean sidereal time, degrees. */
function gmstDeg(date: Date): number {
  const d = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86_400_000
  return ((280.46061837 + 360.98564736629 * d) % 360 + 360) % 360
}

/** Where the galactic core sits in the sky from (lat, lng) at `date`. */
export function galacticCoreAltAz(date: Date, lat: number, lng: number): { altitude: number; azimuth: number } {
  const lst = (gmstDeg(date) + lng + 360) % 360
  const ha = rad(((lst - CORE_RA_DEG + 540) % 360) - 180)
  const φ = rad(lat)
  const δ = rad(CORE_DEC_DEG)
  const alt = Math.asin(Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(ha))
  const az = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(φ) - Math.tan(δ) * Math.cos(φ))
  return { altitude: deg(alt), azimuth: (deg(az) + 180 + 360) % 360 }
}

export interface CoreWindow {
  start: Date
  end: Date
  /** When the core sits highest inside the window. */
  peak: Date
  peakAltitude: number
  /** Core compass azimuth at the peak. */
  peakAzimuth: number
  moonIllumination: number
  /** True when the moon is above the horizon at the peak — it will wash the core out. */
  moonUp: boolean
}

const STEP_MIN = 10

/**
 * Tonight's galactic-core shooting window for the night that starts on the
 * civil day of `nightOf` (spot-local): the longest stretch where the core is
 * at least `minAltitude` up AND the sun is in astronomical darkness (< −18°).
 * Null outside core season (northern winter) or when darkness never coincides.
 */
export function coreWindow(
  nightOf: Date, lat: number, lng: number, timeZone: string, minAltitude = 15,
): CoreWindow | null {
  const day = zoneParts(nightOf, timeZone)
  const noon = zonedWallToInstant(day.year, day.month - 1, day.day, 12, 0, timeZone)
  const scanStart = noon.getTime()
  const scanEnd = scanStart + 24 * 3_600_000 // through tomorrow's noon

  let best: { start: number; end: number } | null = null
  let cur: { start: number; end: number } | null = null
  for (let t = scanStart; t <= scanEnd; t += STEP_MIN * 60_000) {
    const at = new Date(t)
    const sunAlt = deg(SunCalc.getPosition(at, lat, lng).altitude)
    const coreAlt = galacticCoreAltAz(at, lat, lng).altitude
    const good = sunAlt <= -18 && coreAlt >= minAltitude
    if (good) {
      if (!cur) cur = { start: t, end: t }
      cur.end = t
    } else if (cur) {
      if (!best || cur.end - cur.start > best.end - best.start) best = cur
      cur = null
    }
  }
  if (cur && (!best || cur.end - cur.start > best.end - best.start)) best = cur
  if (!best || best.end === best.start) return null

  let peak = best.start
  let peakAltitude = -90
  for (let t = best.start; t <= best.end; t += STEP_MIN * 60_000) {
    const alt = galacticCoreAltAz(new Date(t), lat, lng).altitude
    if (alt > peakAltitude) { peakAltitude = alt; peak = t }
  }
  const peakDate = new Date(peak)
  const moon = moonInfo(peakDate, lat, lng)
  return {
    start: new Date(best.start),
    end: new Date(best.end),
    peak: peakDate,
    peakAltitude: Math.round(peakAltitude),
    peakAzimuth: Math.round(galacticCoreAltAz(peakDate, lat, lng).azimuth),
    moonIllumination: moon.illumination,
    moonUp: moon.elevation > 0,
  }
}

/**
 * The first night from `from` (inclusive) with a core window — tonight during
 * the season, or the season opener when the core is wintering. Null only if
 * nothing shows up inside `maxNights` (e.g. far-north latitudes).
 */
export function nextCoreWindow(
  from: Date, lat: number, lng: number, timeZone: string, maxNights = 250,
): { window: CoreWindow; nightsAway: number } | null {
  for (let i = 0; i < maxNights; i++) {
    const night = new Date(from.getTime() + i * 86_400_000)
    const w = coreWindow(night, lat, lng, timeZone)
    if (w && w.end > from) return { window: w, nightsAway: i }
  }
  return null
}
