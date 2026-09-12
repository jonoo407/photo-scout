import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SpotDetailScreen from '../../src/ui/SpotDetail/SpotDetailScreen'

function renderSpot(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/spot/${id}`]}>
      <Routes>
        <Route path="/spot/:id" element={<SpotDetailScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

/* The Explore chip filters to pet-friendly spots, but a yes/no alone is not
   the useful part — "leashed, never on the beach" and a flat yes are the same
   bit and a different trip. The detail page carries the rule itself, next to
   the other access facts. */

describe('SpotDetailScreen — the pet rule', () => {
  it('states the rule where a spot welcomes leashed dogs', () => {
    renderSpot('fort-de-soto-park')
    expect(screen.getByText(/off-leash Paw Playground dog beach on site/i)).toBeInTheDocument()
  })

  it('states the rule where a spot does NOT — the no is as useful as the yes', () => {
    renderSpot('weedon-island-preserve')
    expect(screen.getByText(/no pets at all, since it is a preserve not a park/i)).toBeInTheDocument()
  })

  it('carries the exception that would otherwise waste a drive', () => {
    // The photograph at Lettuce Lake IS the boardwalk and tower, which is the
    // one part of the park a dog may not go.
    renderSpot('lettuce-lake-park')
    expect(screen.getByText(/never on the boardwalk or tower/i)).toBeInTheDocument()
  })
})
