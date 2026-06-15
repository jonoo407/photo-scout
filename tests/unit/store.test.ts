import { describe, it, expect, beforeEach } from 'vitest'
import { useStore, EMPTY_FILTERS } from '../../src/state/store'

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
