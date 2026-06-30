import { useMemo } from 'react'
import { useStore } from './store'
import { regionSpots } from '../data/spots'
import { REGIONS, type Region } from '../data/regions'
import type { Spot } from '../spots/types'

/** The active region object (label, center, bounds, default home). */
export function useRegion(): Region {
  const id = useStore((s) => s.region)
  return REGIONS[id]
}

/** Spots in the active region — the app scopes to one city at a time. */
export function useRegionSpots(): Spot[] {
  const region = useStore((s) => s.region)
  return useMemo(() => regionSpots(region), [region])
}
