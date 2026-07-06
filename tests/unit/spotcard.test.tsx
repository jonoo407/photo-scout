import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SpotCard } from '../../src/ui/SpotCard'
import type { Spot } from '../../src/spots/types'

const spot = {
  id: 'x', name: 'Test Spot', category: 'skyline', region: 'tampa-bay',
  address: '123 Secret St, Tampa, FL 33600',
  bestFor: ['skyline across water', 'balustrade leading line', 'portraits', 'a fourth thing'],
  media: [],
} as unknown as Spot

function renderCard() {
  return render(<MemoryRouter><SpotCard spot={spot} /></MemoryRouter>)
}

describe('SpotCard', () => {
  it('sells the shot, not the street: shows why the place is photogenic', () => {
    renderCard()
    expect(screen.getByText(/skyline across water · balustrade leading line · portraits/)).toBeInTheDocument()
  })

  it('caps the why-line at three ideas', () => {
    renderCard()
    expect(screen.queryByText(/a fourth thing/)).not.toBeInTheDocument()
  })

  it('keeps the address off the card (it lives on the detail page)', () => {
    renderCard()
    expect(screen.queryByText(/Secret St/)).not.toBeInTheDocument()
  })

  it('falls back to the category glyph when the thumbnail 404s (no broken-image icon)', () => {
    const withPhoto = {
      ...(spot as object),
      media: [{ src: 'https://dead.example/x.jpg', caption: 'c', credit: 'a', license: 'CC' }],
    } as unknown as Spot
    const { container } = render(<MemoryRouter><SpotCard spot={withPhoto} /></MemoryRouter>)
    const img = container.querySelector('.thumbicon img')!
    expect(img).not.toBeNull()
    fireEvent.error(img)
    expect(container.querySelector('.thumbicon img')).toBeNull()
    expect(container.querySelector('.thumbicon svg')).not.toBeNull()
  })
})
