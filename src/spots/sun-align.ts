import SunCalc from 'suncalc'
import { sunPosition } from '../astro/sun-position'
import { zoneParts, zonedWallToInstant } from '../util/tz'

export interface AlignmentHit {
  /** The sunrise/sunset instant the sun sits behind the subject. */
  at: Date
  kind: 'sunrise' | 'sunset'
  /** Sun compass azimuth at that instant. */
  bearing: number
  /** Angular distance from the spot's facing, degrees. */
  delta: number
}

export interface AlignmentOptions {
  toleranceDeg?: number
  count?: number
  horizonDays?: number
  kinds?: Array<'sunrise' | 'sunset'>
}

const angDist = (a: number, b: number) => {
  const d = (((a - b) % 360) + 360) % 360
  return d > 180 ? 360 - d : d
}

/**
 * "Sun-behind-X" finder — the generalized henge scorer. Scans forward from
 * `from` for the next dates the rising or setting sun lines up within
 * `toleranceDeg` of the bearing the photographer shoots toward (spot.facing).
 * Days are resolved at the spot's local noon so each civil day is scanned in
 * the spot's own timezone, matching best-days.ts.
 */
export function sunAlignmentDates(
  facing: number,
  lat: number,
  lng: number,
  timeZone: string,
  from: Date,
  { toleranceDeg = 2, count = 5, horizonDays = 366, kinds = ['sunrise', 'sunset'] }: AlignmentOptions = {},
): AlignmentHit[] {
  const hits: AlignmentHit[] = []
  const start = zoneParts(from, timeZone)
  for (let i = 0; i < horizonDays && hits.length < count; i++) {
    const noon = zonedWallToInstant(start.year, start.month - 1, start.day + i, 12, 0, timeZone)
    const times = SunCalc.getTimes(noon, lat, lng)
    for (const kind of kinds) {
      const at = times[kind]
      if (!at || Number.isNaN(at.getTime()) || at < from) continue
      const { azimuth } = sunPosition(at, lat, lng)
      const delta = angDist(azimuth, facing)
      if (delta <= toleranceDeg) hits.push({ at, kind, bearing: azimuth, delta })
    }
  }
  return hits.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, count)
}
