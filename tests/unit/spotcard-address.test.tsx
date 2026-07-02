import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SpotCard } from '../../src/ui/SpotCard'
import SPOTS from '../../src/data/spots/tampa-bay'
import PHILLY from '../../src/data/spots/philadelphia'

describe('SpotCard — address on each card', () => {
  it('shows the spot street address', () => {
    const spot = SPOTS.find((s) => s.id === 'st-paul-ame')!
    render(<MemoryRouter><SpotCard spot={spot} /></MemoryRouter>)
    expect(screen.getByText('506 E Harrison St, Tampa, FL 33602')).toBeInTheDocument()
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
    const spot = PHILLY.find((s) => s.media.length === 0)! // bok-bar
    const { container } = render(<MemoryRouter><SpotCard spot={spot} /></MemoryRouter>)
    expect(container.querySelector('.thumbicon img')).toBeNull()
    expect(container.querySelector('.thumbicon svg')).not.toBeNull()
  })
})
