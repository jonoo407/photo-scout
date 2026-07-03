import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('offers a Share action that copies the spot deep link', async () => {
    // jsdom has no navigator.share → the clipboard fallback path.
    // (Spy must be installed AFTER userEvent.setup, which stubs clipboard.)
    const user = userEvent.setup()
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderSpot('independence-hall')
    await user.click(screen.getByRole('button', { name: /share/i }))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('#/spot/independence-hall'))
    expect(await screen.findByText(/link copied/i)).toBeInTheDocument()
  })

  it('shows a locally-consistent drive·distance for a cross-city spot, not the active-home distance', () => {
    // Active region (and home) is Tampa Bay; Independence Hall is in Philadelphia,
    // ~0.8 mi from Philly's City Hall default home. The pill must read as a short
    // local hop (a few min · <1 mi), NOT the Tampa-home distance ("931.5 mi").
    renderSpot('independence-hall')
    expect(document.body.textContent).toMatch(/\d min · 0\.\d mi/)
    expect(document.body.textContent).not.toMatch(/9\d\d\.\d mi/)
  })
})
