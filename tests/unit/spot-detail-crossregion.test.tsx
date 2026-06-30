import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SpotDetailScreen from '../../src/ui/SpotDetail/SpotDetailScreen'
import { useStore } from '../../src/state/store'

function renderSpot(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/spot/${id}`]}>
      <Routes>
        <Route path="/spot/:id" element={<SpotDetailScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SpotDetailScreen — cross-region deep links', () => {
  beforeEach(() => useStore.setState({ region: 'tampa-bay' }))

  it('resolves a Philadelphia spot even when the active region is Tampa Bay', () => {
    // A shared/bookmarked link to a spot in a non-active city must still open.
    renderSpot('independence-hall')
    expect(screen.queryByText('Spot not found.')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Independence Hall' })).toBeInTheDocument()
  })

  it('still resolves an active-region spot', () => {
    renderSpot('curtis-hixon-waterfront-park')
    expect(screen.queryByText('Spot not found.')).not.toBeInTheDocument()
  })
})
