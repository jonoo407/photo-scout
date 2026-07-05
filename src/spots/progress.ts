import { REGION_LIST, type RegionId } from '../data/regions'
import type { Spot } from './types'

export interface RegionProgress {
  regionId: RegionId
  label: string
  done: number
  total: number
}

/**
 * Per-region shot progress for the Saved screen: how many of each city's spots
 * you've been to. Regions come back in REGIONS declaration order; a region with
 * no loaded spots is omitted (nothing to make progress against).
 */
export function regionProgress(visited: string[], spots: Spot[]): RegionProgress[] {
  const visitedSet = new Set(visited)
  const byRegion = new Map<RegionId, { done: number; total: number }>()
  for (const s of spots) {
    const row = byRegion.get(s.region) ?? { done: 0, total: 0 }
    row.total += 1
    if (visitedSet.has(s.id)) row.done += 1
    byRegion.set(s.region, row)
  }
  return REGION_LIST.filter((r) => byRegion.has(r.id)).map((r) => ({
    regionId: r.id,
    label: r.label,
    ...byRegion.get(r.id)!,
  }))
}
