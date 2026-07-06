import { REGION_LIST, type RegionId } from '../data/regions'
import { SPOT_REGION, REGION_SPOT_COUNT } from '../data/spot-index'

export interface RegionProgress {
  regionId: RegionId
  label: string
  done: number
  total: number
}

/**
 * Per-region shot progress: how many of each city's spots you've been to.
 * Pure core — takes an id→region map and per-region totals so callers never
 * have to load spot modules (docs/SCALING.md breakpoint 1). Regions come back
 * in REGIONS declaration order; regions without a total are omitted.
 */
export function regionProgress(
  visited: string[],
  idToRegion: Record<string, RegionId>,
  totals: Partial<Record<RegionId, number>>,
): RegionProgress[] {
  const done = new Map<RegionId, number>()
  for (const id of new Set(visited)) {
    const region = idToRegion[id]
    if (region) done.set(region, (done.get(region) ?? 0) + 1)
  }
  return REGION_LIST.filter((r) => (totals[r.id] ?? 0) > 0).map((r) => ({
    regionId: r.id,
    label: r.label,
    done: done.get(r.id) ?? 0,
    total: totals[r.id]!,
  }))
}

/** Progress against the real catalog, via the generated spot index. */
export function savedProgress(visited: string[]): RegionProgress[] {
  return regionProgress(visited, SPOT_REGION, REGION_SPOT_COUNT)
}
