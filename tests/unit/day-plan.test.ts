import { describe, it, expect } from 'vitest'
import { planDay, dayBlocks, rankForBlock, scoreSpot, pinPlan } from '../../src/spots/day-plan'
import { matchesLight } from '../../src/spots/next-up'
import { weatherVerdict } from '../../src/weather/verdict'
import SPOTS from '../../src/data/spots/tampa-bay'
import { DEFAULT_HOME } from '../../src/data/home.config'

// Fixed date (Thu Jun 25 2026, local noon) so the plan is deterministic.
const DATE = new Date(2026, 5, 25, 12, 0, 0)

describe('dayBlocks', () => {
  it('produces morning, midday and evening blocks in time order', () => {
    const b = dayBlocks(DATE, DEFAULT_HOME.lat, DEFAULT_HOME.lng)
    expect(b.map((x) => x.key)).toEqual(['sunrise', 'midday', 'sunset'])
    expect(b[0].time.getTime()).toBeLessThan(b[1].time.getTime())
    expect(b[1].time.getTime()).toBeLessThan(b[2].time.getTime())
  })
})

describe('planDay', () => {
  it('returns at least a morning and an evening stop', () => {
    const stops = planDay({ date: DATE, home: DEFAULT_HOME, spots: SPOTS })
    expect(stops.length).toBeGreaterThanOrEqual(2)
  })

  it('never repeats a spot across the day (fixes the 2-spot collapse)', () => {
    const ids = planDay({ date: DATE, home: DEFAULT_HOME, spots: SPOTS }).map((s) => s.spot.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('matches each non-anchor stop to its block’s light', () => {
    for (const s of planDay({ date: DATE, home: DEFAULT_HOME, spots: SPOTS })) {
      expect(s.block.lights.some((l) => matchesLight(s.spot, l))).toBe(true)
    }
  })

  it('orders stops by time of day', () => {
    const stops = planDay({ date: DATE, home: DEFAULT_HOME, spots: SPOTS })
    for (let i = 1; i < stops.length; i++) {
      expect(stops[i].block.time.getTime()).toBeGreaterThan(stops[i - 1].block.time.getTime())
    }
  })

  it('honors an anchor: places it exactly once and flags it', () => {
    const stops = planDay({ date: DATE, home: DEFAULT_HOME, spots: SPOTS, anchorId: 'dali-museum' })
    const dali = stops.filter((s) => s.spot.id === 'dali-museum')
    expect(dali).toHaveLength(1)
    expect(dali[0].anchored).toBe(true)
  })

  it('offers ranked alternatives for swapping', () => {
    const stops = planDay({ date: DATE, home: DEFAULT_HOME, spots: SPOTS })
    expect(stops[0].alternatives.length).toBeGreaterThan(0)
    expect(stops[0].alternatives.every((a) => a.id !== stops[0].spot.id)).toBe(true)
  })

  it('weather verdict favors sheltered and penalizes outdoor categories', () => {
    const rainy = weatherVerdict({ cloudCover: 90, precipProbability: 80 }) // favors interiors/gardens/architecture; avoids skyline/rooftop/beach
    const block = dayBlocks(DATE, DEFAULT_HOME.lat, DEFAULT_HOME.lng).find((b) => b.key === 'sunset')!
    const base = { block, from: DEFAULT_HOME, sunLat: DEFAULT_HOME.lat, sunLng: DEFAULT_HOME.lng }
    const arch = SPOTS.find((s) => s.id === 'ybor-city')! // architecture
    const sky = SPOTS.find((s) => s.id === 'curtis-hixon-waterfront-park')! // skyline
    expect(scoreSpot(arch, { ...base, verdict: rainy }) - scoreSpot(arch, base)).toBeCloseTo(0.2, 5)
    expect(scoreSpot(sky, { ...base, verdict: rainy }) - scoreSpot(sky, base)).toBeCloseTo(-0.35, 5)
  })

  it('flags stops where weather is a factor, and stays clean on a fair day', () => {
    const rainy = weatherVerdict({ cloudCover: 90, precipProbability: 80 })
    const wet = planDay({ date: DATE, home: DEFAULT_HOME, spots: SPOTS, blockWeather: { sunrise: rainy, midday: rainy, sunset: rainy } })
    const flagged = wet.filter((s) => s.weather?.mood === 'rainy')
    expect(flagged.length).toBeGreaterThan(0)
    expect(flagged[0].weather?.note).toMatch(/rain/i)

    const clear = weatherVerdict({ cloudCover: 5, precipProbability: 0 })
    const fair = planDay({ date: DATE, home: DEFAULT_HOME, spots: SPOTS, blockWeather: { sunrise: clear, midday: clear, sunset: clear } })
    expect(fair.every((s) => !s.weather)).toBe(true)
  })

  it('rankForBlock re-ranks candidates by proximity to the current origin', () => {
    const sunset = dayBlocks(DATE, DEFAULT_HOME.lat, DEFAULT_HOME.lng).find((b) => b.key === 'sunset')!
    const cands = SPOTS.filter((s) => ['curtis-hixon-waterfront-park', 'st-pete-pier'].includes(s.id))
    const base = { block: sunset, sunLat: DEFAULT_HOME.lat, sunLng: DEFAULT_HOME.lng }
    const fromTampa = rankForBlock(cands, { ...base, from: { lat: 27.95, lng: -82.46 } })
    const fromStPete = rankForBlock(cands, { ...base, from: { lat: 27.77, lng: -82.63 } })
    expect(fromTampa[0].id).toBe('curtis-hixon-waterfront-park')
    expect(fromStPete[0].id).toBe('st-pete-pier')
  })
})

describe('pinPlan (saved/shared plans — fixed stops, no re-planning)', () => {
  const REFS = [
    { block: 'sunset' as const, spotId: 'honeymoon-island-sp' },
    { block: 'sunrise' as const, spotId: 'bayshore-boulevard' },
  ]

  it('renders exactly the pinned spots, in block time order, with drive legs', () => {
    const stops = pinPlan({ date: DATE, home: DEFAULT_HOME, spots: SPOTS, stops: REFS })
    expect(stops.map((s) => s.spot.id)).toEqual(['bayshore-boulevard', 'honeymoon-island-sp'])
    expect(stops.map((s) => s.block.key)).toEqual(['sunrise', 'sunset'])
    expect(stops[0].driveMin).toBeGreaterThanOrEqual(0)
    expect(stops[1].driveMin).toBeGreaterThan(0) // honeymoon is a real drive from bayshore
    expect(stops.every((s) => s.alternatives.length === 0)).toBe(true) // pinned = not swappable
    expect(stops.every((s) => typeof s.open.state === 'string')).toBe(true)
  })

  it('skips ids that are not in the loaded spots instead of crashing', () => {
    const stops = pinPlan({
      date: DATE, home: DEFAULT_HOME, spots: SPOTS,
      stops: [{ block: 'midday', spotId: 'not-a-spot' }, ...REFS],
    })
    expect(stops.map((s) => s.spot.id)).toEqual(['bayshore-boulevard', 'honeymoon-island-sp'])
  })
})
