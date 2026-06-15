import type { Hours } from './hours'

export type Category =
  | 'skyline' | 'rooftop' | 'architecture' | 'interiors'
  | 'gardens' | 'beach' | 'nature'

export type Light =
  | 'sunrise' | 'morning-golden' | 'blue-hour' | 'daytime'
  | 'evening-golden' | 'sunset' | 'night-astro' | 'open-shade'

export interface SpotMedia {
  src: string
  thumb?: string
  caption: string
  credit: string
  license: string
  sourceUrl?: string
  focalLengthMm?: number
  light?: Light
}

export interface SignatureShot {
  id: string
  label: string
  description?: string
  bestLight?: Light
}

export interface Logistics {
  parking?: { label: string; lat?: number; lng?: number }
  restrooms?: boolean
  feeDetail?: string
  dressCode?: string
  accessibility?: string
  crowdTiming?: string
}

export interface CraftGuide {
  lightStrategy: string
  whatToShoot: string[]
  signatureShots: SignatureShot[]
  compositionTips: string[]
  vantagePoints?: string[]
  gear: { lens?: string; tripod?: boolean; filters?: string[]; settingsHint?: string }
  ifCloudy?: string
  pairWith?: string[]
  accessTips?: string
}

export interface ServiceTime {
  day: string
  time: string
  label?: string
}

export interface Spot {
  id: string
  name: string
  category: Category
  city: string
  region: 'tampa-bay'
  bestFor: string[]
  bestLight: Light[]
  lat: number
  lng: number
  coordsNeedVerify?: boolean
  facing: number | null // bearing shot TOWARD (deg from north); null if N/A
  feeUSD: number
  isFree: boolean
  feeNote?: string
  driveMinutes?: number
  hours: Hours
  phone: string | null
  notes: string
  caveats?: string
  services?: ServiceTime[]
  tideStationId?: string
  craft: CraftGuide
  media: SpotMedia[]
  logistics?: Logistics
}

export const CATEGORIES: Category[] = [
  'skyline', 'rooftop', 'architecture', 'interiors', 'gardens', 'beach', 'nature',
]
export const CATEGORY_LABEL: Record<Category, string> = {
  skyline: 'Skyline',
  rooftop: 'Rooftop',
  architecture: 'Architecture',
  interiors: 'Interiors',
  gardens: 'Gardens',
  beach: 'Beach',
  nature: 'Nature',
}
export const CATEGORY_COLOR: Record<Category, string> = {
  skyline: '#378ADD',
  rooftop: '#E0922F',
  architecture: '#7F77DD',
  interiors: '#D4537E',
  gardens: '#1D9E75',
  beach: '#D85A30',
  nature: '#888780',
}
