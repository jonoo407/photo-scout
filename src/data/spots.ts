import type { Spot } from '../spots/types'
import type { RegionId } from './regions'

/* Per-region spot data is dynamically imported so each city ships as its own
   lazy chunk — adding cities never grows the initial bundle. Add a city = add a
   module under ./spots/<id>.ts and one entry here. */
const loaders: Record<string, () => Promise<{ default: Spot[] }>> = {
  'tampa-bay': () => import('./spots/tampa-bay'),
  philadelphia: () => import('./spots/philadelphia'),
}

const cache = new Map<RegionId, Spot[]>()

/** Region ids that have a spot module (used to resolve cross-region deep links). */
export function allRegionIds(): RegionId[] {
  return Object.keys(loaders)
}

/** Load a region's spots (cached). Unknown region → []. */
export async function loadRegionSpots(region: RegionId): Promise<Spot[]> {
  const hit = cache.get(region)
  if (hit) return hit
  const load = loaders[region]
  const spots = load ? (await load()).default : []
  cache.set(region, spots)
  return spots
}

/** Synchronous cache read — undefined until the region has loaded. */
export function cachedRegionSpots(region: RegionId): Spot[] | undefined {
  return cache.get(region)
}

/** Seed the cache (tests use this so the async hook resolves synchronously). */
export function primeRegionSpots(region: RegionId, spots: Spot[]): void {
  cache.set(region, spots)
}
