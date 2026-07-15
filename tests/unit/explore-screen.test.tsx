import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import ExploreScreen from '../../src/ui/Explore/ExploreScreen'
import { useStore, EMPTY_FILTERS } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

// Leaflet can't run in jsdom — the map lens is exercised in the browser pass.
vi.mock('../../src/ui/Explore/MapView', () => ({
  default: () => <div data-testid="map-view">map</div>,
}))

function LocationProbe() {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname + loc.search}</div>
}

const renderExplore = (initial = '/explore') =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/explore" element={<><ExploreScreen /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay', filters: EMPTY_FILTERS, wishlist: [] })
  window.sessionStorage.clear()
})

describe('Explore — one task, two lenses', () => {
  it('renders the list lens by default with a List ⇄ Map toggle', () => {
    renderExplore()
    expect(screen.getByRole('heading', { name: 'Explore' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'List' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Map' })).toBeInTheDocument()
    expect(screen.getByText('Bayshore Boulevard')).toBeInTheDocument()
    expect(screen.queryByTestId('map-view')).not.toBeInTheDocument()
  })

  it('switches to the map lens and writes ?view=map to the URL', async () => {
    const user = userEvent.setup()
    renderExplore()
    await user.click(screen.getByRole('button', { name: 'Map' }))
    expect(await screen.findByTestId('map-view')).toBeInTheDocument()
    expect(screen.getByTestId('loc').textContent).toBe('/explore?view=map')
  })

  it('opens straight into the map lens from a ?view=map deep link', async () => {
    renderExplore('/explore?view=map')
    expect(await screen.findByTestId('map-view')).toBeInTheDocument()
  })

  it('keeps the Browse filter set working (search still narrows)', async () => {
    const user = userEvent.setup()
    renderExplore()
    await user.type(screen.getByPlaceholderText(/Tampa Bay spots/i), 'bayshore')
    expect(screen.getByText('Bayshore Boulevard')).toBeInTheDocument()
    expect(screen.queryByText('Fred Howard Park')).not.toBeInTheDocument()
  })
})

describe('Explore — light buckets from Plan', () => {
  it('shows the bucket row and Dark sky keeps only dark-sky spots', async () => {
    const user = userEvent.setup()
    renderExplore()
    expect(screen.getByText(/BEST IN THE LIGHT/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Dark sky' }))
    expect(screen.getByText('Fort De Soto Park')).toBeInTheDocument()
    expect(screen.queryByText('Bayshore Boulevard')).not.toBeInTheDocument()
    // Tapping again clears the bucket.
    await user.click(screen.getByRole('button', { name: 'Dark sky' }))
    expect(screen.getByText('Bayshore Boulevard')).toBeInTheDocument()
  })

  it('hides the pet-friendly chip while the region has no pet data (B16)', () => {
    renderExplore()
    expect(screen.queryByRole('button', { name: /pet-friendly/i })).not.toBeInTheDocument()
  })
})
