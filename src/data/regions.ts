import { DEFAULT_HOME, type HomeLocation } from './home.config'

export type RegionId = 'tampa-bay' | 'philadelphia'

export interface Region {
  id: RegionId
  label: string
  center: { lat: number; lng: number }
  bounds: { latMin: number; latMax: number; lngMin: number; lngMax: number }
  defaultHome: HomeLocation
}

export const REGIONS: Record<RegionId, Region> = {
  'tampa-bay': {
    id: 'tampa-bay',
    label: 'Tampa Bay',
    center: { lat: 27.94, lng: -82.55 },
    bounds: { latMin: 27.4, latMax: 28.3, lngMin: -83.0, lngMax: -82.25 },
    defaultHome: DEFAULT_HOME,
  },
  philadelphia: {
    id: 'philadelphia',
    label: 'Philadelphia',
    center: { lat: 39.9526, lng: -75.1652 },
    bounds: { latMin: 39.8, latMax: 40.15, lngMin: -75.45, lngMax: -74.9 },
    defaultHome: {
      label: 'Philadelphia City Hall',
      address: 'Philadelphia City Hall, Philadelphia, PA 19107',
      lat: 39.9526,
      lng: -75.1635,
    },
  },
}

export const REGION_LIST: Region[] = Object.values(REGIONS)
export const REGION_IDS: RegionId[] = REGION_LIST.map((r) => r.id)

export function regionContains(region: Region, lat: number, lng: number): boolean {
  const b = region.bounds
  return lat >= b.latMin && lat <= b.latMax && lng >= b.lngMin && lng <= b.lngMax
}

/** Which region a point falls in, or null if it's outside every region. */
export function regionForPoint(lat: number, lng: number): RegionId | null {
  return REGION_LIST.find((r) => regionContains(r, lat, lng))?.id ?? null
}
