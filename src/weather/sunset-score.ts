export interface SunsetCloud {
  cloudLow: number // %
  cloudMid: number // %
  cloudHigh: number // %
  humidity: number // %
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

/* A good sunset needs mid/high cloud to catch colour, a clear-ish horizon (low
   cloud blocks the light path) and low haze/humidity. Peaks when the combined
   mid+high cloud coverage is in the 30-70% band. */
function idealBand(x: number): number {
  if (x <= 0) return 0
  if (x < 30) return x / 30
  if (x <= 70) return 1
  return Math.max(0, (100 - x) / 30)
}

/* Combine the two independent cloud layers as overlapping coverage (0-100)
   rather than adding them — a naive `mid + high` can reach 200, pushing a
   richly textured sky past the band and scoring it 0. */
function combinedCover(mid: number, high: number): number {
  const m = clamp(mid / 100, 0, 1)
  const h = clamp(high / 100, 0, 1)
  return (1 - (1 - m) * (1 - h)) * 100
}

export function sunsetScore({ cloudLow, cloudMid, cloudHigh, humidity }: SunsetCloud): number {
  const band = idealBand(combinedCover(cloudMid, cloudHigh))
  const lowPenalty = 1 - 0.7 * clamp(cloudLow / 100, 0, 1)
  const humidPenalty = 1 - 0.4 * clamp((humidity - 75) / 25, 0, 1)
  const score01 = clamp(band * lowPenalty * humidPenalty, 0, 1)
  return Math.round(score01 * 100)
}

export type SunsetGrade = 'great' | 'decent' | 'meh'
export function sunsetLabel(score: number): SunsetGrade {
  if (score >= 70) return 'great'
  if (score >= 40) return 'decent'
  return 'meh'
}
