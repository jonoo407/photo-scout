import { describe, it, expect } from 'vitest'
import { mergeState, syncableSlice, type SyncedState } from '../../src/auth/sync-merge'
import { DEFAULT_HOME } from '../../src/data/home.config'

const local: SyncedState = {
  wishlist: ['bayshore-boulevard', 'boathouse-row'],
  visited: ['curtis-hixon-waterfront-park'],
  checklist: { 'fort-de-soto-park': ['gulf-sunset'] },
  spotNotes: { 'bayshore-boulevard': 'shoot from the south rail', 'fort-de-soto-park': 'local draft' },
  home: DEFAULT_HOME,
  region: 'tampa-bay',
  units: 'imperial',
  mapsApp: 'apple',
  theme: 'auto',
}

const remote: SyncedState = {
  wishlist: ['boathouse-row', 'elfreths-alley'],
  visited: ['independence-hall'],
  checklist: { 'fort-de-soto-park': ['skyway-east'], 'race-street-pier': ['bridge-up'] },
  spotNotes: { 'race-street-pier': 'early ferry shadow', 'fort-de-soto-park': 'remote older note' },
  home: { label: 'Current location', lat: 39.95, lng: -75.16 },
  region: 'philadelphia',
  units: 'metric',
  mapsApp: 'google',
  theme: 'dark',
}

describe('mergeState (sign-in reconciliation)', () => {
  it('unions the lists — nothing saved on either device is lost', () => {
    const m = mergeState(local, remote)
    expect(m.wishlist).toEqual(['bayshore-boulevard', 'boathouse-row', 'elfreths-alley'])
    expect(m.visited).toEqual(['curtis-hixon-waterfront-park', 'independence-hall'])
    expect(m.checklist['fort-de-soto-park']).toEqual(['gulf-sunset', 'skyway-east'])
    expect(m.checklist['race-street-pier']).toEqual(['bridge-up'])
  })

  it('personal notes merge per spot — content is never lost, the device in hand wins conflicts', () => {
    const notes = mergeState(local, remote).spotNotes!
    expect(notes['bayshore-boulevard']).toBe('shoot from the south rail') // local-only kept
    expect(notes['race-street-pier']).toBe('early ferry shadow') // remote-only kept
    expect(notes['fort-de-soto-park']).toBe('local draft') // conflict → local wins
  })

  it('remote scalars win (the synced account is the source of truth for prefs)', () => {
    const m = mergeState(local, remote)
    expect(m.region).toBe('philadelphia')
    expect(m.home.label).toBe('Current location')
    expect(m.units).toBe('metric')
    expect(m.mapsApp).toBe('google')
    expect(m.theme).toBe('dark')
  })

  it('no remote yet → local passes through unchanged (first push)', () => {
    expect(mergeState(local, null)).toEqual(local)
  })

  it('is idempotent — merging twice adds nothing new', () => {
    const once = mergeState(local, remote)
    expect(mergeState(once, remote)).toEqual(once)
  })
})

describe('syncableSlice', () => {
  it('extracts exactly the synced fields from the store state (no filters, no functions)', () => {
    const slice = syncableSlice({
      ...local,
      filters: { query: 'x' },
      setHome: () => {},
    } as never)
    expect(Object.keys(slice).sort()).toEqual(
      ['checklist', 'home', 'mapsApp', 'region', 'spotNotes', 'theme', 'units', 'visited', 'wishlist'],
    )
  })
})
