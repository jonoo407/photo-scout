import { useEffect, useState } from 'react'
import { useStore } from './store'
import { loadRegionSpots, cachedRegionSpots } from '../data/spots'
import { getRegion, type Region } from '../data/regions'
import type { Spot } from '../spots/types'

/** The active region object (label, center, bounds, timeZone, default home). */
export function useRegion(): Region {
  const id = useStore((s) => s.region)
  return getRegion(id)
}

/** Spots in the active region (lazy-loaded per city). `loading` until ready. */
export function useRegionSpots(): { spots: Spot[]; loading: boolean } {
  const region = useStore((s) => s.region)
  const [, tick] = useState(0)
  useEffect(() => {
    if (cachedRegionSpots(region)) return
    let alive = true
    loadRegionSpots(region).then(() => { if (alive) tick((x) => x + 1) })
    return () => { alive = false }
  }, [region])
  const spots = cachedRegionSpots(region)
  return { spots: spots ?? [], loading: spots === undefined }
}
