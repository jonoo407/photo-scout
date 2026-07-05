import { sunPosition } from '../astro/sun-position'
import { windowTimeFor } from './best-days'
import type { Spot } from './types'

/** Shortest signed rotation from `from` to `to`, degrees in (−180, 180]. */
export function signedDelta(from: number, to: number): number {
  const d = (((to - from) % 360) + 360) % 360
  return d > 180 ? d - 360 : d
}

export interface OrientationReading {
  alpha?: number | null
  absolute?: boolean
  /** iOS Safari: compass heading in degrees, already clockwise-from-north. */
  webkitCompassHeading?: number
}

/**
 * Compass heading (degrees clockwise from north) from a deviceorientation
 * event, or null when the reading can't be trusted (relative alpha drifts
 * from an arbitrary zero, so only `absolute` readings count).
 */
export function headingFromEvent(e: OrientationReading): number | null {
  if (typeof e.webkitCompassHeading === 'number' && Number.isFinite(e.webkitCompassHeading)) {
    return ((e.webkitCompassHeading % 360) + 360) % 360
  }
  if (typeof e.alpha === 'number' && Number.isFinite(e.alpha) && e.absolute === true) {
    return ((360 - e.alpha) % 360 + 360) % 360 // alpha counts counter-clockwise
  }
  return null
}

export interface SunTarget {
  /** Compass bearing to the sun at the spot's prime light window. */
  bearing: number
  /** The instant the bearing points at. */
  at: Date
  /** Sun elevation then — below 0 means it's under the horizon. */
  elevation: number
  /** 0 = today's window, 1 = it already passed so this is tomorrow's. */
  daysAhead: number
}

/**
 * Where the sun will be at this spot's NEXT prime window. A window that
 * already slipped by rolls to tomorrow — an arrow pointing at where the sun
 * was this morning is worse than no arrow.
 */
export function sunTarget(spot: Spot, date: Date = new Date()): SunTarget {
  for (let daysAhead = 0; ; daysAhead++) {
    const day = new Date(date.getTime() + daysAhead * 86_400_000)
    const at = windowTimeFor(spot, day, spot.lat, spot.lng)
    if (at.getTime() < date.getTime() && daysAhead < 2) continue
    const { azimuth, elevation } = sunPosition(at, spot.lat, spot.lng)
    return { bearing: azimuth, at, elevation, daysAhead }
  }
}
