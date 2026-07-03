import { useEffect, useState } from 'react'
import { useStore } from './store'
import { loadRegionSpots, cachedRegionSpots, allRegionIds } from '../data/spots'
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

/** Every city's spots combined (for cross-region views like Saved). */
export function useAllSpots(): { spots: Spot[]; loading: boolean } {
  const [, tick] = useState(0)
  const ids = allRegionIds()
  const missing = ids.filter((r) => !cachedRegionSpots(r))
  useEffect(() => {
    if (!missing.length) return
    let alive = true
    void Promise.all(missing.map((r) => loadRegionSpots(r))).then(() => { if (alive) tick((x) => x + 1) })
    return () => { alive = false }
  }, [missing.length]) // eslint-disable-line react-hooks/exhaustive-deps
  return {
    spots: ids.flatMap((r) => cachedRegionSpots(r) ?? []),
    loading: missing.length > 0,
  }
}

/**
 * Resolve a single spot by id across every city. Checks the active region first
 * (the common case — tapping from the list, no extra load), then any other
 * cached region, and finally lazy-loads remaining cities until found. This makes
 * shared/bookmarked spot deep links open even when their city isn't active.
 */
export function useSpotById(id: string | undefined): { spot: Spot | undefined; loading: boolean } {
  const activeRegion = useStore((s) => s.region)
  const [, tick] = useState(0)

  const find = (): Spot | undefined => {
    if (!id) return undefined
    const order = [activeRegion, ...allRegionIds().filter((r) => r !== activeRegion)]
    for (const r of order) {
      const hit = cachedRegionSpots(r)?.find((s) => s.id === id)
      if (hit) return hit
    }
    return undefined
  }
  const spot = find()
  const uncached = allRegionIds().filter((r) => !cachedRegionSpots(r))

  useEffect(() => {
    if (!id || spot || uncached.length === 0) return
    let alive = true
    ;(async () => {
      for (const r of uncached) {
        const loaded = await loadRegionSpots(r)
        if (!alive) return
        if (loaded.some((s) => s.id === id)) { tick((x) => x + 1); return }
      }
      if (alive) tick((x) => x + 1) // searched everything → settle on "not found"
    })()
    return () => { alive = false }
  }, [id, spot, uncached.length])

  return { spot, loading: !spot && uncached.length > 0 }
}
