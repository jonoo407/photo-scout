import type { Spot, Light } from './types'
import type { Filters } from '../state/store'
import { matchesLight } from './next-up'

/* Explore's filter core, pure. The screen enriches each spot with live
   context (open state, drive time, wishlist membership) and this decides
   membership — every axis testable without rendering. */

export interface LiveContext {
  openState: string
  driveMin: number
  inWishlist: boolean
}

export function passesFilters(spot: Spot, f: Filters, live: LiveContext): boolean {
  const q = f.query.trim().toLowerCase()
  if (q && !(`${spot.name} ${spot.city} ${spot.bestFor.join(' ')}`.toLowerCase().includes(q))) return false
  if (f.categories.length && !f.categories.includes(spot.category)) return false
  if (f.openNow && live.openState !== 'open') return false
  if (f.freeOnly && !spot.isFree) return false
  if (f.wishlistOnly && !live.inWishlist) return false
  if (f.darkSkyOnly && !spot.darkSky) return false
  if (f.petFriendlyOnly && !spot.petFriendly) return false
  if (f.maxDriveMin != null && live.driveMin > f.maxDriveMin) return false
  if (f.lights.length && !f.lights.some((l) => matchesLight(spot, l))) return false
  return true
}

/* Plan's spots-by-light buckets, reborn as Explore's second chip row
   (IA redesign 1e) — plus blue hour and dark sky. */

export interface LightBucket {
  id: 'sunset' | 'sunrise' | 'blue' | 'daytime' | 'dark'
  label: string
  lights?: Light[]
  darkSky?: boolean
}

export const LIGHT_BUCKETS: readonly LightBucket[] = [
  { id: 'sunset', label: 'Sunset / evening', lights: ['sunset', 'evening-golden'] },
  { id: 'sunrise', label: 'Sunrise / morning', lights: ['sunrise', 'morning-golden'] },
  { id: 'blue', label: 'Blue hour', lights: ['blue-hour'] },
  { id: 'daytime', label: 'Daytime', lights: ['daytime', 'open-shade'] },
  { id: 'dark', label: 'Dark sky', darkSky: true },
]

/** The filter fields a bucket chip sets (tapping the active one clears them). */
export function bucketFilterPatch(b: LightBucket): Pick<Filters, 'lights' | 'darkSkyOnly'> {
  return { lights: b.lights ?? [], darkSkyOnly: !!b.darkSky }
}

const sameLights = (a: Light[], b: Light[]) =>
  a.length === b.length && a.every((l) => b.includes(l))

/** Which bucket the current filters correspond to — null for custom sets
    (e.g. the single-light deep link from Today) or no light filter at all. */
export function activeBucketId(f: Filters): LightBucket['id'] | null {
  for (const b of LIGHT_BUCKETS) {
    if (sameLights(f.lights, b.lights ?? []) && f.darkSkyOnly === !!b.darkSky) {
      if (f.lights.length || f.darkSkyOnly) return b.id
    }
  }
  return null
}
