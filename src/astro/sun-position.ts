import SunCalc from 'suncalc'

export interface SunPosition {
  /** Compass azimuth in degrees from north, clockwise, in [0, 360). */
  azimuth: number
  /** Elevation above the horizon in degrees. */
  elevation: number
}

/* suncalc returns azimuth in radians measured from SOUTH, going clockwise
   (west-positive). Normalize to the compass convention used everywhere else in
   the app: degrees from NORTH, clockwise. */
export function sunPosition(date: Date, lat: number, lng: number): SunPosition {
  const p = SunCalc.getPosition(date, lat, lng)
  const azimuth = ((p.azimuth * 180) / Math.PI + 180 + 360) % 360
  const elevation = (p.altitude * 180) / Math.PI
  return { azimuth, elevation }
}
