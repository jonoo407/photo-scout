import type { BlockKey } from './day-plan'

/* A saved/shared day plan IS its URL: /#/day?date=YYYY-MM-DD&stops=block:id,…
   One canonical format serves persistence (saved plans store it decomposed)
   and sharing (text the link; the recipient's DayScreen pins the same stops). */

export interface PlanStopRef {
  block: BlockKey
  spotId: string
}

const BLOCKS: BlockKey[] = ['sunrise', 'midday', 'sunset']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ID_RE = /^[a-z0-9-]{1,60}$/

/** In-app route for a plan (hash-router path). */
export function planPath(dateYmd: string, stops: PlanStopRef[]): string {
  const enc = stops.map((s) => `${s.block}:${s.spotId}`).join(',')
  return `/day?date=${dateYmd}&stops=${enc}`
}

export function planUrl(dateYmd: string, stops: PlanStopRef[]): string {
  return `https://shootvantage.com/#${planPath(dateYmd, stops)}`
}

export interface PinnedPlan {
  dateYmd: string
  /** The civil day at device-local noon — safe for sun math, no midnight rolls. */
  date: Date
  stops: PlanStopRef[]
}

/** Null unless the params carry a complete, valid pinned plan. */
export function parsePinnedPlan(params: URLSearchParams): PinnedPlan | null {
  const dateYmd = params.get('date') ?? ''
  const rawStops = params.get('stops') ?? ''
  if (!DATE_RE.test(dateYmd) || !rawStops) return null

  const seen = new Set<string>()
  const stops: PlanStopRef[] = []
  for (const part of rawStops.split(',')) {
    const [block, spotId] = part.split(':')
    if (!BLOCKS.includes(block as BlockKey) || !ID_RE.test(spotId ?? '')) continue
    if (seen.has(block)) continue
    seen.add(block)
    stops.push({ block: block as BlockKey, spotId })
  }
  if (!stops.length) return null

  const [y, m, d] = dateYmd.split('-').map(Number)
  return { dateYmd, date: new Date(y, m - 1, d, 12), stops }
}
