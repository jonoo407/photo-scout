import { describe, it, expect } from 'vitest'
import { passesFilters, LIGHT_BUCKETS, bucketFilterPatch, activeBucketId } from '../../src/spots/filter'
import { EMPTY_FILTERS, type Filters } from '../../src/state/store'
import type { Spot } from '../../src/spots/types'

/* Explore's filter core, extracted pure so every axis is testable without
   rendering — including the IA-redesign additions: light buckets, dark-sky,
   and pet-friendly (B16). */

const spot = (over: Partial<Spot>): Spot => ({
  id: 'test-spot', name: 'Test Spot', category: 'skyline', city: 'Tampa',
  region: 'tampa-bay', bestFor: ['skyline'], bestLight: ['sunset'],
  lat: 27.9, lng: -82.5, address: '1 Test St, Tampa, FL 33600', facing: 270,
  feeUSD: 0, isFree: true, hours: { kind: 'always' } as Spot['hours'],
  phone: null, notes: '', media: [],
  craft: { lightStrategy: '', whatToShoot: [], signatureShots: [], compositionTips: [], gear: {} },
  ...over,
})

const live = { openState: 'open', driveMin: 10, inWishlist: false }
const f = (over: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, ...over })

describe('passesFilters', () => {
  it('passes everything on empty filters', () => {
    expect(passesFilters(spot({}), EMPTY_FILTERS, live)).toBe(true)
  })

  it('filters by query, category, open-now, free, wishlist, and drive time', () => {
    expect(passesFilters(spot({ name: 'Bayshore' }), f({ query: 'bay' }), live)).toBe(true)
    expect(passesFilters(spot({ name: 'Bayshore' }), f({ query: 'pier' }), live)).toBe(false)
    expect(passesFilters(spot({ category: 'beach' }), f({ categories: ['skyline'] }), live)).toBe(false)
    expect(passesFilters(spot({}), f({ openNow: true }), { ...live, openState: 'closed' })).toBe(false)
    expect(passesFilters(spot({ isFree: false }), f({ freeOnly: true }), live)).toBe(false)
    expect(passesFilters(spot({}), f({ wishlistOnly: true }), live)).toBe(false)
    expect(passesFilters(spot({}), f({ wishlistOnly: true }), { ...live, inWishlist: true })).toBe(true)
    expect(passesFilters(spot({}), f({ maxDriveMin: 30 }), { ...live, driveMin: 45 })).toBe(false)
  })

  it('filters by light windows', () => {
    expect(passesFilters(spot({ bestLight: ['sunset'] }), f({ lights: ['sunset'] }), live)).toBe(true)
    expect(passesFilters(spot({ bestLight: ['daytime'] }), f({ lights: ['sunset'] }), live)).toBe(false)
  })

  it('dark-sky only keeps genuinely dark spots', () => {
    expect(passesFilters(spot({ darkSky: true }), f({ darkSkyOnly: true }), live)).toBe(true)
    expect(passesFilters(spot({}), f({ darkSkyOnly: true }), live)).toBe(false)
  })

  it('pet-friendly only keeps tagged spots (B16)', () => {
    expect(passesFilters(spot({ petFriendly: true }), f({ petFriendlyOnly: true }), live)).toBe(true)
    expect(passesFilters(spot({ petFriendly: false }), f({ petFriendlyOnly: true }), live)).toBe(false)
    expect(passesFilters(spot({}), f({ petFriendlyOnly: true }), live)).toBe(false)
  })
})

describe('light buckets (Plan → Explore)', () => {
  it('covers the Plan buckets plus blue hour and dark sky', () => {
    expect(LIGHT_BUCKETS.map((b) => b.id)).toEqual(['sunset', 'sunrise', 'blue', 'daytime', 'dark'])
    const sunset = LIGHT_BUCKETS[0]
    expect(sunset.lights).toEqual(['sunset', 'evening-golden'])
    expect(LIGHT_BUCKETS.find((b) => b.id === 'dark')?.darkSky).toBe(true)
  })

  it('produces a filter patch and recognizes it back as the active bucket', () => {
    for (const b of LIGHT_BUCKETS) {
      const patch = bucketFilterPatch(b)
      expect(activeBucketId(f(patch))).toBe(b.id)
    }
    expect(activeBucketId(EMPTY_FILTERS)).toBeNull()
    // A custom single-light filter (e.g. deep-linked from Today) is no bucket.
    expect(activeBucketId(f({ lights: ['evening-golden'] }))).toBeNull()
  })
})
