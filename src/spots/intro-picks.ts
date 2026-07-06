import type { Spot, Category } from './types'

/**
 * Onboarding sampler: a few photogenic, varied spots for a brand-new user to
 * seed their want-to-go list from. Photo required (first impressions), one
 * category at a time round-robin (variety), data order preserved
 * (deterministic).
 */
export function introPicks(spots: Spot[], n = 5): Spot[] {
  const withPhoto = spots.filter((s) => s.media.length > 0)
  const byCategory = new Map<Category, Spot[]>()
  for (const s of withPhoto) {
    const list = byCategory.get(s.category) ?? []
    list.push(s)
    byCategory.set(s.category, list)
  }
  const buckets = [...byCategory.values()]
  const picks: Spot[] = []
  for (let round = 0; picks.length < n; round++) {
    const before = picks.length
    for (const bucket of buckets) {
      if (picks.length >= n) break
      if (bucket[round]) picks.push(bucket[round])
    }
    if (picks.length === before) break // everything exhausted
  }
  return picks
}
