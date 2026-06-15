import SunCalc from 'suncalc'

export const MOON_PHASE_NAMES = [
  'new', 'waxing crescent', 'first quarter', 'waxing gibbous',
  'full', 'waning gibbous', 'last quarter', 'waning crescent',
] as const
export type MoonPhaseName = (typeof MOON_PHASE_NAMES)[number]

/** suncalc phase: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
export function moonPhaseName(phase: number): MoonPhaseName {
  const x = ((phase % 1) + 1) % 1
  if (x < 0.03 || x > 0.97) return 'new'
  if (x < 0.22) return 'waxing crescent'
  if (x < 0.28) return 'first quarter'
  if (x < 0.47) return 'waxing gibbous'
  if (x < 0.53) return 'full'
  if (x < 0.72) return 'waning gibbous'
  if (x < 0.78) return 'last quarter'
  return 'waning crescent'
}

export interface MoonInfo {
  phase: number
  illumination: number // percent, 0-100
  phaseName: MoonPhaseName
  rise: Date | null
  set: Date | null
  azimuth: number
  elevation: number
}

export function moonInfo(date: Date, lat: number, lng: number): MoonInfo {
  const ill = SunCalc.getMoonIllumination(date)
  const times = SunCalc.getMoonTimes(date, lat, lng)
  const pos = SunCalc.getMoonPosition(date, lat, lng)
  return {
    phase: ill.phase,
    illumination: Math.round(ill.fraction * 100),
    phaseName: moonPhaseName(ill.phase),
    rise: times.rise ?? null,
    set: times.set ?? null,
    azimuth: ((pos.azimuth * 180) / Math.PI + 180 + 360) % 360,
    elevation: (pos.altitude * 180) / Math.PI,
  }
}
