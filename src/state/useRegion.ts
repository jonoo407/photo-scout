import { useEffect, useState } from 'react'
import { useStore } from './store'
import { loadRegionSpots, cachedRegionSpots } from '../data/spots'
import { SPOT_REGION } from '../data/spot-index'
import { getRegion, type Region, type RegionId } from '../data/regions'
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

/**
 * Resolve specific spot ids, loading ONLY the cities they live in (via the
 * generated spot index) — Saved and client lists stay fast no matter how many
 * cities the catalog grows (docs/SCALING.md breakpoint 1). Unknown ids are
 * simply absent from the map.
 */
export function useSpotsByIds(ids: string[]): { byId: Map<string, Spot>; loading: boolean } {
  const [, tick] = useState(0)
  const regions = [...new Set(ids.map((id) => SPOT_REGION[id]).filter(Boolean))] as RegionId[]
  const missing = regions.filter((r) => !cachedRegionSpots(r))
  const key = missing.join('|')
  useEffect(() => {
    if (!missing.length) return
    let alive = true
    void Promise.all(missing.map((r) => loadRegionSpots(r))).then(() => { if (alive) tick((x) => x + 1) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const byId = new Map<string, Spot>()
  for (const r of regions) {
    for (const s of cachedRegionSpots(r) ?? []) {
      if (ids.includes(s.id)) byId.set(s.id, s)
    }
  }
  return { byId, loading: missing.length > 0 }
}

/**
 * Resolve a single spot by id: the index names its city, so deep links load
 * exactly one chunk — and unknown ids settle to "not found" with zero loads.
 */
export function useSpotById(id: string | undefined): { spot: Spot | undefined; loading: boolean } {
  const region = id ? SPOT_REGION[id] : undefined
  const [, tick] = useState(0)
  const cached = region ? cachedRegionSpots(region) : undefined

  useEffect(() => {
    if (!region || cached) return
    let alive = true
    void loadRegionSpots(region).then(() => { if (alive) tick((x) => x + 1) })
    return () => { alive = false }
  }, [region, cached])

  return {
    spot: cached?.find((s) => s.id === id),
    loading: !!region && !cached,
  }
}
