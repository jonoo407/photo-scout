import SunCalc from 'suncalc'
import { sunPosition } from './sun-position'

const R = 6_371_000 // mean Earth radius, meters
const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

/** Great-circle destination from (lat, lng) along a compass bearing. */
export function destPoint(lat: number, lng: number, bearingDeg: number, distanceM: number): { lat: number; lng: number } {
  const δ = distanceM / R
  const θ = rad(bearingDeg)
  const φ1 = rad(lat)
  const λ1 = rad(lng)
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ))
  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2),
  )
  return { lat: deg(φ2), lng: ((deg(λ2) + 540) % 360) - 180 }
}

export interface SunPathLine {
  /** Compass bearing toward the sun at that moment, degrees from north. */
  bearing: number
  /** Line endpoint `distanceM` out from the spot along the bearing. */
  to: { lat: number; lng: number }
  /** The sunrise/sunset instant the bearing was computed for. */
  at: Date
}

export interface SunPaths {
  sunrise: SunPathLine | null
  sunset: SunPathLine | null
}

/**
 * PhotoPills-style sun lines for a spot: where on the horizon the sun rises and
 * sets on the given date. Null on days the sun never rises/sets there.
 */
export function sunPathLines(lat: number, lng: number, date: Date, distanceM = 1500): SunPaths {
  const times = SunCalc.getTimes(date, lat, lng)
  const line = (at: Date): SunPathLine | null => {
    if (!at || Number.isNaN(at.getTime())) return null
    const { azimuth } = sunPosition(at, lat, lng)
    return { bearing: azimuth, to: destPoint(lat, lng, azimuth, distanceM), at }
  }
  return { sunrise: line(times.sunrise), sunset: line(times.sunset) }
}
