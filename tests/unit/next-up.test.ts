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
