import { DEFAULT_HOME, type HomeLocation } from './home.config'
import { haversineMiles } from '../spots/distance'

// Data-driven: a region id is any string keyed in REGIONS (ready to grow to
// hundreds of US cities, then worldwide). Add a city = add one entry here.
export type RegionId = string

export interface Region {
  id: RegionId
  label: string
  timeZone: string // IANA, e.g. 'America/New_York' — times + hours resolve in this zone
  center: { lat: number; lng: number }
  bounds: { latMin: number; latMax: number; lngMin: number; lngMax: number }
  defaultHome: HomeLocation
}

export const DEFAULT_REGION: RegionId = 'tampa-bay'

export const REGIONS: Record<RegionId, Region> = {
  'tampa-bay': {
    id: 'tampa-bay',
    label: 'Tampa Bay',
    timeZone: 'America/New_York',
    center: { lat: 27.94, lng: -82.55 },
    bounds: { latMin: 27.4, latMax: 28.3, lngMin: -83.0, lngMax: -82.25 },
    defaultHome: DEFAULT_HOME,
  },
  philadelphia: {
    id: 'philadelphia',
    label: 'Philadelphia',
    timeZone: 'America/New_York',
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

/** Safe lookup — falls back to the default region for an unknown/stale id. */
export function getRegion(id: RegionId | undefined): Region {
  return (id && REGIONS[id]) || REGIONS[DEFAULT_REGION]
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

/** The best city for a point: the one whose bounds contain it, else the closest center. */
export function nearestRegion(lat: number, lng: number): RegionId {
  const inside = regionForPoint(lat, lng)
  if (inside) return inside
  let best = REGION_LIST[0]
  let bestMiles = Infinity
  for (const r of REGION_LIST) {
    const miles = haversineMiles(r.center, { lat, lng })
    if (miles < bestMiles) { bestMiles = miles; best = r }
  }
  return best.id
}
