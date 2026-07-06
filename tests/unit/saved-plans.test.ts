import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useStore } from '../../src/state/store'
import { mergeState } from '../../src/auth/sync-merge'

beforeEach(() => {
  useStore.setState({ savedPlans: [] })
})

const STOPS = [{ block: 'sunset' as const, spotId: 'honeymoon-island-sp' }]

describe('store — saved plans', () => {
  it('saves a plan with identity and lists newest first', () => {
    let id1 = ''
    act(() => { id1 = useStore.getState().savePlan({ name: 'Beach eve', date: '2026-07-12', stops: STOPS }) })
    act(() => { useStore.getState().savePlan({ name: 'Second', date: '2026-07-13', stops: STOPS }) })
    const plans = useStore.getState().savedPlans
    expect(plans).toHaveLength(2)
    expect(plans[0].name).toBe('Second') // newest first
    expect(id1).toBeTruthy()
    expect(plans[1].id).toBe(id1)
    expect(plans[1].createdAt).toBeTruthy()
  })

  it('deletes by id', () => {
    let id = ''
    act(() => { id = useStore.getState().savePlan({ name: 'Gone soon', date: '2026-07-12', stops: STOPS }) })
    act(() => useStore.getState().deletePlan(id))
    expect(useStore.getState().savedPlans).toHaveLength(0)
  })
})

describe('sync — saved plans merge', () => {
  it('unions plans by id across devices; the device in hand wins duplicates', () => {
    const mine = { id: 'a', name: 'mine', date: '2026-07-12', stops: STOPS, createdAt: '2026-07-06T00:00:00Z' }
    const theirs = { id: 'b', name: 'theirs', date: '2026-07-13', stops: STOPS, createdAt: '2026-07-05T00:00:00Z' }
    const conflictRemote = { ...mine, name: 'remote copy' }
    const m = mergeState(
      { wishlist: [], visited: [], checklist: {}, savedPlans: [mine], home: { label: 'x', lat: 0, lng: 0 }, region: 'tampa-bay', units: 'imperial', mapsApp: 'apple', theme: 'auto' },
      { wishlist: [], visited: [], checklist: {}, savedPlans: [theirs, conflictRemote], home: { label: 'x', lat: 0, lng: 0 }, region: 'tampa-bay', units: 'imperial', mapsApp: 'apple', theme: 'auto' },
    )
    const names = (m.savedPlans ?? []).map((p) => p.name).sort()
    expect(names).toEqual(['mine', 'theirs'])
  })
})
