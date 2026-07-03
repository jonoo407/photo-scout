import { describe, it, expect, beforeEach } from 'vitest'
import { useStore, EMPTY_FILTERS, healStaleHome, applyTheme } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'
import { REGIONS } from '../../src/data/regions'

beforeEach(() => {
  useStore.setState({ wishlist: [], visited: [], checklist: {}, filters: EMPTY_FILTERS })
})

describe('app store', () => {
  it('toggles want-to-go on and off', () => {
    useStore.getState().toggleWishlist('bayshore-boulevard')
    expect(useStore.getState().wishlist).toContain('bayshore-boulevard')
    useStore.getState().toggleWishlist('bayshore-boulevard')
    expect(useStore.getState().wishlist).not.toContain('bayshore-boulevard')
  })

  it('toggles been-there', () => {
    useStore.getState().toggleVisited('curtis-hixon-waterfront-park')
    expect(useStore.getState().visited).toEqual(['curtis-hixon-waterfront-park'])
  })

  it('toggles a signature shot per spot', () => {
    useStore.getState().toggleShot('curtis-hixon-waterfront-park', 'sunburst-minaret')
    expect(useStore.getState().checklist['curtis-hixon-waterfront-park']).toContain('sunburst-minaret')
    useStore.getState().toggleShot('curtis-hixon-waterfront-park', 'sunburst-minaret')
    expect(useStore.getState().checklist['curtis-hixon-waterfront-park']).not.toContain('sunburst-minaret')
  })

  it('merges filter patches and resets', () => {
    useStore.getState().setFilters({ openNow: true, query: 'pier' })
    expect(useStore.getState().filters.openNow).toBe(true)
    expect(useStore.getState().filters.query).toBe('pier')
    useStore.getState().resetFilters()
    expect(useStore.getState().filters).toEqual(EMPTY_FILTERS)
  })
})

describe('healStaleHome (persisted-home migration)', () => {
  it('resets the old seeded home (wrong coords, no address) to the corrected default', () => {
    const stale = { label: '3812 W Leona St, Tampa', lat: 27.8916, lng: -82.4843, coordsNeedVerify: true }
    expect(healStaleHome(stale)).toEqual(DEFAULT_HOME)
  })

  it('leaves a "Current location" home untouched (GPS coords are correct)', () => {
    const cur = { label: 'Current location', lat: 27.7, lng: -82.6 }
    expect(healStaleHome(cur)).toBe(cur)
  })

  it('leaves an already-fixed home (has an address) untouched', () => {
    expect(healStaleHome(DEFAULT_HOME)).toBe(DEFAULT_HOME)
  })

  it('falls back to the default for a missing home', () => {
    expect(healStaleHome(undefined)).toEqual(DEFAULT_HOME)
  })

  it('the shipped default is a neutral public place, not a personal address', () => {
    // The original default was the developer's real street address — it must
    // never ship to users again, in any field.
    const s = JSON.stringify(DEFAULT_HOME)
    expect(s).not.toMatch(/Leona/i)
    expect(DEFAULT_HOME.label).toBe('Downtown Tampa')
  })

  it('migrates a persisted copy of the old personal-address default to the neutral one', () => {
    const oldDefault = { label: '3812 W Leona St, Tampa', address: '3812 W Leona St, Tampa, FL 33629', lat: 27.9147, lng: -82.5064 }
    expect(healStaleHome(oldDefault)).toEqual(DEFAULT_HOME)
  })

  it('still keeps a genuine user-set home (typed address)', () => {
    const mine = { label: '123 Main St, Tampa', address: '123 Main St, Tampa', lat: 27.93, lng: -82.46 }
    expect(healStaleHome(mine)).toBe(mine)
  })
})

describe('theme', () => {
  beforeEach(() => { document.documentElement.removeAttribute('data-theme') })

  it('setTheme stores the choice and applies it to <html>', () => {
    useStore.getState().setTheme('dark')
    expect(useStore.getState().theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('applyTheme("auto") clears the attribute so the system preference wins', () => {
    applyTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    applyTheme('auto')
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  })
})

describe('region switching', () => {
  beforeEach(() => { useStore.setState({ region: 'tampa-bay', home: DEFAULT_HOME }) })

  it('moves home to the new region default when the current home is out of region', () => {
    useStore.getState().setRegion('philadelphia')
    expect(useStore.getState().region).toBe('philadelphia')
    expect(useStore.getState().home).toEqual(REGIONS.philadelphia.defaultHome)
  })

  it('keeps an in-region home when switching to that region', () => {
    const phillyHome = { label: 'My Philly place', address: '123 Market St, Philadelphia, PA', lat: 39.96, lng: -75.16 }
    useStore.setState({ home: phillyHome, region: 'tampa-bay' })
    useStore.getState().setRegion('philadelphia')
    expect(useStore.getState().home).toBe(phillyHome)
  })

  it('an unknown region id falls back to the default region instead of crashing', () => {
    // e.g. a stale persisted deep link or a removed city id
    useStore.getState().setRegion('atlantis')
    expect(useStore.getState().region).toBe('tampa-bay')
    expect(useStore.getState().home).toEqual(REGIONS['tampa-bay'].defaultHome)
  })
})

describe('persistence shape', () => {
  it('does not persist transient filters (a stale search/filter must not survive a restart)', () => {
    const opts = useStore.persist.getOptions()
    expect(opts.partialize).toBeDefined()
    const persisted = opts.partialize!(useStore.getState()) as Record<string, unknown>
    expect(persisted).not.toHaveProperty('filters')
    // durable prefs must still persist
    for (const key of ['wishlist', 'visited', 'checklist', 'home', 'region', 'units', 'mapsApp', 'theme']) {
      expect(persisted, key).toHaveProperty(key)
    }
  })
})
