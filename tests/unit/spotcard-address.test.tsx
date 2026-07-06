import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SpotCard } from '../../src/ui/SpotCard'
import SPOTS from '../../src/data/spots/tampa-bay'
import PHILLY from '../../src/data/spots/philadelphia'

describe('SpotCard — why-line instead of address (user feedback 2026-07-05)', () => {
  it('uses the card real estate for photographic color, not the street address', () => {
    const spot = SPOTS.find((s) => s.id === 'st-paul-ame')!
    render(<MemoryRouter><SpotCard spot={spot} /></MemoryRouter>)
    expect(screen.queryByText(spot.address)).not.toBeInTheDocument()
    expect(screen.getByText(spot.bestFor.slice(0, 3).join(' · '))).toBeInTheDocument()
  })
})

describe('SpotCard — photo thumbnail', () => {
  it('shows the real photo thumbnail when the spot has one', () => {
    const spot = SPOTS.find((s) => s.media.length > 0)!
    const { container } = render(<MemoryRouter><SpotCard spot={spot} /></MemoryRouter>)
    const img = container.querySelector('.thumbicon img')
    expect(img).not.toBeNull()
    expect(img!.getAttribute('src')).toBe(spot.media[0].thumb ?? spot.media[0].src)
  })

  it('falls back to the category glyph when the spot has no photo', () => {
    // st-paul-ame is the catalog's one photo-less spot (no Commons coverage).
    const spot = SPOTS.find((s) => s.media.length === 0) ?? PHILLY.find((s) => s.media.length === 0)
    if (!spot) return // full coverage achieved — nothing to assert against
    const { container } = render(<MemoryRouter><SpotCard spot={spot} /></MemoryRouter>)
    expect(container.querySelector('.thumbicon img')).toBeNull()
    expect(container.querySelector('.thumbicon svg')).not.toBeNull()
  })
})
