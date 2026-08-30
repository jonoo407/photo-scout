import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useRegion, useRegionSpots, useSpotsByIds, useSpotById } from '../../src/state/useRegion'
import { useStore } from '../../src/state/store'

/* Lazy per-city spot loading (docs/SCALING.md breakpoint 1). The setup file
   primes both shipped regions, so the resolved paths are what most tests see;
   the loading paths need a module registry with an empty cache, which is what
   the `fresh()` helper below buys. */

describe('useRegion', () => {
  it('follows the active region in the store', () => {
    useStore.setState({ region: 'tampa-bay' })
    const { result, rerender } = renderHook(() => useRegion())
    expect(result.current.label).toMatch(/Tampa/i)
    expect(result.current.timeZone).toBe('America/New_York')

    act(() => { useStore.setState({ region: 'philadelphia' }) })
    rerender()
    expect(result.current.label).toMatch(/Philadelphia/i)
  })
})

describe('useRegionSpots', () => {
  it('returns the primed city synchronously', () => {
    useStore.setState({ region: 'tampa-bay' })
    const { result } = renderHook(() => useRegionSpots())
    expect(result.current.loading).toBe(false)
    expect(result.current.spots.length).toBeGreaterThan(10)
    expect(result.current.spots.every((s) => s.city)).toBe(true)
  })

  it('swaps the whole set when the region changes', () => {
    useStore.setState({ region: 'tampa-bay' })
    const { result, rerender } = renderHook(() => useRegionSpots())
    const tampa = result.current.spots.map((s) => s.id)

    act(() => { useStore.setState({ region: 'philadelphia' }) })
    rerender()
    const philly = result.current.spots.map((s) => s.id)
    expect(philly.some((id) => tampa.includes(id))).toBe(false)
  })
})

describe('useSpotsByIds', () => {
  it('resolves ids across cities in one map', () => {
    const { result } = renderHook(() =>
      useSpotsByIds(['bayshore-boulevard', 'boathouse-row']))
    expect(result.current.loading).toBe(false)
    expect([...result.current.byId.keys()].sort()).toEqual(['bayshore-boulevard', 'boathouse-row'])
  })

  it('omits ids that are not in the catalogue at all', () => {
    const { result } = renderHook(() =>
      useSpotsByIds(['bayshore-boulevard', 'retired-spot', '']))
    expect([...result.current.byId.keys()]).toEqual(['bayshore-boulevard'])
    expect(result.current.loading).toBe(false) // an unknown id loads nothing
  })

  it('loads nothing for an empty list', () => {
    const { result } = renderHook(() => useSpotsByIds([]))
    expect(result.current.byId.size).toBe(0)
    expect(result.current.loading).toBe(false)
  })
})

describe('useSpotById', () => {
  it('resolves a known spot', () => {
    const { result } = renderHook(() => useSpotById('bayshore-boulevard'))
    expect(result.current.spot?.name).toBeTruthy()
    expect(result.current.loading).toBe(false)
  })

  it('settles to not-found for an unknown id without loading a city', () => {
    const { result } = renderHook(() => useSpotById('no-such-spot'))
    expect(result.current.spot).toBeUndefined()
    expect(result.current.loading).toBe(false)
  })

  it('settles to not-found for no id at all', () => {
    const { result } = renderHook(() => useSpotById(undefined))
    expect(result.current.spot).toBeUndefined()
    expect(result.current.loading).toBe(false)
  })
})

/* The loading paths. `vi.resetModules()` gives a module registry whose spot
   cache is EMPTY — the state a real first visit is in, which the setup file's
   priming otherwise hides from every other test in the suite. */
describe('lazy loading from a cold cache', () => {
  beforeEach(() => { vi.resetModules() })
  afterEach(() => { vi.resetModules() })

  it('reports loading first, then resolves the city', async () => {
    const { useRegionSpots: cold } = await import('../../src/state/useRegion')
    useStore.setState({ region: 'tampa-bay' })

    const { result } = renderHook(() => cold())
    expect(result.current.loading).toBe(true)
    expect(result.current.spots).toEqual([]) // never undefined — the UI maps over it

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.spots.length).toBeGreaterThan(10)
  })

  it('resolves a deep-linked spot from cold, loading only its city', async () => {
    const { useSpotById: cold } = await import('../../src/state/useRegion')
    const { result } = renderHook(() => cold('boathouse-row'))
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.spot?.id).toBe('boathouse-row')
  })

  it('resolves ids spanning two cities from cold', async () => {
    const { useSpotsByIds: cold } = await import('../../src/state/useRegion')
    const { result } = renderHook(() => cold(['bayshore-boulevard', 'boathouse-row']))
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect([...result.current.byId.keys()].sort()).toEqual(['bayshore-boulevard', 'boathouse-row'])
  })
})
