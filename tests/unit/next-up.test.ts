import { describe, it, expect } from 'vitest'
import { nextUp } from '../../src/spots/next-up'
import SPOTS from '../../src/data/spots/tampa-bay'
import { DEFAULT_HOME } from '../../src/data/home.config'
import { weatherVerdict } from '../../src/weather/verdict'

const LAT = 27.9477
const LNG = -82.4584
// 2026-06-14 18:30 EDT (22:30 UTC) — before evening golden hour.
const NOW = new Date('2026-06-14T22:30:00Z')

describe('nextUp', () => {
  const res = nextUp({ now: NOW, lat: LAT, lng: LNG, home: DEFAULT_HOME, spots: SPOTS })

  it('picks evening golden hour as the next window at 6:30pm', () => {
    expect(res.window.kind).toBe('evening-golden')
    expect(res.window.start.getTime()).toBeGreaterThan(NOW.getTime())
  })

  it('returns a non-empty, score-descending ranking', () => {
    expect(res.ranked.length).toBeGreaterThan(0)
    for (let i = 1; i < res.ranked.length; i++) {
      expect(res.ranked[i - 1].score).toBeGreaterThanOrEqual(res.ranked[i].score)
    }
  })

  it('excludes spots that are closed at the window', () => {
    const ids = res.ranked.map((r) => r.spot.id)
    expect(ids).not.toContain('usf-botanical-gardens') // closes 4pm
    expect(ids).not.toContain('sacred-heart-catholic-church') // closes 3pm
  })

  it('ranks a west-facing skyline spot well for the evening', () => {
    const ids = res.ranked.map((r) => r.spot.id)
    expect(ids).toContain('curtis-hixon-waterfront-park')
    const idx = ids.indexOf('curtis-hixon-waterfront-park')
    expect(idx).toBeLessThan(Math.ceil(res.ranked.length / 2))
  })

  it('floats a want-to-go spot upward', () => {
    const withWish = nextUp({ now: NOW, lat: LAT, lng: LNG, home: DEFAULT_HOME, spots: SPOTS, wishlist: new Set(['tampa-riverwalk']) })
    const base = res.ranked.find((r) => r.spot.id === 'tampa-riverwalk')!.score
    const boosted = withWish.ranked.find((r) => r.spot.id === 'tampa-riverwalk')!.score
    expect(boosted).toBeGreaterThan(base)
  })

  it('does not double-count the light-tag match for spots without a facing', () => {
    // A no-facing spot's base score IS the light-tag match (0.85). The +0.1 tag
    // kicker must not stack on top of it — that double-counts one signal and
    // lets unverifiable spots outrank ones with a verified sun direction.
    const spot = {
      ...SPOTS[0],
      id: 'synthetic-nofacing', name: 'Synthetic', facing: null,
      lat: DEFAULT_HOME.lat, lng: DEFAULT_HOME.lng, // 0 mi → full +0.1 distance
      bestLight: ['evening-golden' as const],
      hours: { days: { sun: { open: '24h' as const }, mon: { open: '24h' as const }, tue: { open: '24h' as const }, wed: { open: '24h' as const }, thu: { open: '24h' as const }, fri: { open: '24h' as const }, sat: { open: '24h' as const } } },
    }
    const r = nextUp({ now: NOW, lat: LAT, lng: LNG, home: DEFAULT_HOME, spots: [spot] })
    expect(r.window.kind).toBe('evening-golden')
    // 0.85 (tag match) + 0.1 (distance) = 0.95; the buggy double-count gave 1.05
    expect(r.ranked[0].score).toBeCloseTo(0.95, 5)
  })

  it('computes drive time from the actual home, not a hardcoded per-spot value', () => {
    // A spot may carry a legacy stored driveMinutes, but the displayed drive must
    // reflect where the user actually is (this is what "use my location" changes).
    const farHome = { label: 'Far', lat: 28.6, lng: -82.0 } // ~50 mi NE of downtown Tampa
    const far = nextUp({ now: NOW, lat: LAT, lng: LNG, home: farHome, spots: SPOTS })
    const id = 'curtis-hixon-waterfront-park'
    const nearDrive = res.ranked.find((r) => r.spot.id === id)!.driveMinutes
    const farDrive = far.ranked.find((r) => r.spot.id === id)!.driveMinutes
    expect(farDrive).toBeGreaterThan(nearDrive)
  })

  it('accepts an optional weather verdict without error', () => {
    const v = weatherVerdict({ cloudCover: 10, precipProbability: 0 })
    const r = nextUp({ now: NOW, lat: LAT, lng: LNG, home: DEFAULT_HOME, spots: SPOTS, verdict: v })
    expect(r.ranked.length).toBeGreaterThan(0)
  })
})
