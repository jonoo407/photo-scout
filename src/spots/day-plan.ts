import { computeSunTimes } from '../astro/sun-times'
import { sunPosition } from '../astro/sun-position'
import { classifyLightDirection } from '../astro/sun-direction'
import { resolveOpenStatus, type OpenStatus } from './hours'
import { haversineMiles } from './distance'
import { matchesLight } from './next-up'
import type { Spot, Light } from './types'
import type { HomeLocation } from '../data/home.config'

export type BlockKey = 'sunrise' | 'midday' | 'sunset'

export interface PlanBlock {
  key: BlockKey
  label: string
  start: Date // when the window opens (for the schedule column)
  time: Date  // representative shooting moment (used for light + open checks)
  lights: Light[]
}

export interface PlanStop {
  block: PlanBlock
  spot: Spot
  reason: string
  open: OpenStatus
  driveMin: number // estimated drive from the previous stop (or home for the first)
  anchored: boolean
  alternatives: Spot[] // ranked swap options for this block
}

export interface PlanDayInput {
  date: Date
  home: HomeLocation
  spots: Spot[]
  wishlist?: Set<string>
  anchorId?: string
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

const BLOCK_REASON: Record<BlockKey, string> = {
  sunrise: 'Great in the morning light',
  midday: 'Works in flat midday light',
  sunset: 'Great at sunset',
}

export function dayBlocks(date: Date, lat: number, lng: number): PlanBlock[] {
  const t = computeSunTimes(date, lat, lng)
  const mid = (a: Date, b: Date) => new Date((a.getTime() + b.getTime()) / 2)
  return [
    { key: 'sunrise', label: 'Sunrise & morning golden', start: t.blueHourMorning.start, time: mid(t.goldenHourMorning.start, t.goldenHourMorning.end), lights: ['sunrise', 'morning-golden'] },
    { key: 'midday', label: 'Midday — interiors & gardens', start: t.solarNoon, time: t.solarNoon, lights: ['daytime', 'open-shade'] },
    { key: 'sunset', label: 'Evening golden & sunset', start: t.goldenHourEvening.start, time: mid(t.goldenHourEvening.start, t.goldenHourEvening.end), lights: ['evening-golden', 'sunset'] },
  ]
}

/** How many of a block's lights a spot is suited to (0 = not a fit). */
function lightFit(spot: Spot, block: PlanBlock): number {
  return block.lights.filter((l) => matchesLight(spot, l)).length
}

export interface RankContext {
  block: PlanBlock
  from: { lat: number; lng: number } // route origin — re-ranking keys off this
  sunLat: number
  sunLng: number
  wishlist?: Set<string>
}

/** Score a spot for a block from a given route origin (higher = better fit). */
export function scoreSpot(spot: Spot, ctx: RankContext): number {
  let s = lightFit(spot, ctx.block) * 0.15
  if (spot.facing != null) {
    const sun = sunPosition(ctx.block.time, ctx.sunLat, ctx.sunLng)
    if (sun.elevation > 0) {
      const dir = classifyLightDirection(sun.azimuth, spot.facing, sun.elevation)
      s += dir === 'silhouette' ? 0.25 : dir === 'front' ? 0.2 : dir === 'side' ? 0.15 : 0.1
    }
  }
  const miles = haversineMiles(ctx.from, spot)
  s += clamp(1 - miles / 40, 0, 1) * 0.5 // cluster the day to cut driving
  if (ctx.wishlist?.has(spot.id)) s += 0.3
  return s
}

/** Rank candidates best-first for a block, from the current route origin. */
export function rankForBlock(candidates: Spot[], ctx: RankContext): Spot[] {
  return [...candidates].sort((a, b) => scoreSpot(b, ctx) - scoreSpot(a, ctx))
}

function bestBlockFor(spot: Spot, blocks: PlanBlock[]): BlockKey {
  // Prefer sunset, then sunrise, then midday on ties (most anchors are evening spots).
  const order: BlockKey[] = ['sunset', 'sunrise', 'midday']
  let best = blocks[0]
  let bestScore = -1
  for (const key of order) {
    const block = blocks.find((b) => b.key === key)!
    const fit = lightFit(spot, block)
    if (fit > bestScore) { bestScore = fit; best = block }
  }
  return best.key
}

export function planDay({ date, home, spots, wishlist, anchorId }: PlanDayInput): PlanStop[] {
  const blocks = dayBlocks(date, home.lat, home.lng)
  const sunTimesFor = (d: Date) => {
    const tt = computeSunTimes(d, home.lat, home.lng)
    return { sunrise: tt.sunrise, sunset: tt.sunset }
  }
  const anchor = anchorId ? spots.find((s) => s.id === anchorId) : undefined
  const anchorBlock = anchor ? bestBlockFor(anchor, blocks) : undefined

  const used = new Set<string>()
  if (anchor) used.add(anchor.id) // reserve the anchor for its block only

  const stops: PlanStop[] = []
  let from: { lat: number; lng: number } = home

  for (const block of blocks) {
    const ctx: RankContext = { block, from, sunLat: home.lat, sunLng: home.lng, wishlist }
    const ranked = rankForBlock(
      spots.filter((s) => !used.has(s.id) && lightFit(s, block) > 0 &&
        resolveOpenStatus(s.hours, block.time, sunTimesFor).state !== 'closed'),
      ctx,
    )

    let chosen: Spot | undefined
    let anchored = false
    if (anchor && anchorBlock === block.key) {
      chosen = anchor // honor the user's pick regardless of open hours (e.g. exterior shots)
      anchored = true
    } else {
      chosen = ranked[0]
    }
    if (!chosen) continue

    used.add(chosen.id)
    const driveMin = from === home
      ? (chosen.driveMinutes ?? Math.round(haversineMiles(home, chosen) * 2.2))
      : Math.round(haversineMiles(from, chosen) * 2.2)
    stops.push({
      block,
      spot: chosen,
      reason: anchored ? 'Your anchor for the day' : BLOCK_REASON[block.key],
      open: resolveOpenStatus(chosen.hours, block.time, sunTimesFor),
      driveMin,
      anchored,
      alternatives: ranked.filter((s) => s.id !== chosen!.id).slice(0, 8),
    })
    from = chosen
  }

  return stops
}
