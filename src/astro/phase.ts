import SunCalc from 'suncalc'
import { sunPosition } from './sun-position'

export type DayPhase =
  | 'night'
  | 'morning-blue'
  | 'morning-golden'
  | 'day'
  | 'evening-golden'
  | 'evening-blue'

/* Live phase from the sun's elevation + whether it's before solar noon (rising).
   Bands match PhotoPills: day > +6, golden +6..-4, blue -4..-6, night < -6. */
export function detectPhase(date: Date, lat: number, lng: number): DayPhase {
  const elevation = sunPosition(date, lat, lng).elevation
  const solarNoon = SunCalc.getTimes(date, lat, lng).solarNoon
  const rising = date.getTime() < solarNoon.getTime()

  if (elevation >= 6) return 'day'
  if (elevation >= -4) return rising ? 'morning-golden' : 'evening-golden'
  if (elevation >= -6) return rising ? 'morning-blue' : 'evening-blue'
  return 'night'
}
