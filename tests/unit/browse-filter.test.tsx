import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BrowseScreen from '../../src/ui/Browse/BrowseScreen'
import { useStore, EMPTY_FILTERS } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

beforeEach(() => { useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay', filters: EMPTY_FILTERS, wishlist: [] }) })

describe('Browse — max drive-time filter', () => {
  it('hides spots beyond the selected max drive time', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><BrowseScreen /></MemoryRouter>)

    // Fred Howard Park (~55 min) is visible before filtering
    expect(screen.getByText('Fred Howard Park')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /≤30 min/i }))

    expect(screen.queryByText('Fred Howard Park')).not.toBeInTheDocument()
    expect(screen.getByText('Bayshore Boulevard')).toBeInTheDocument() // ~6 min, stays
    expect(useStore.getState().filters.maxDriveMin).toBe(30)
  })
})

describe('Browse — light filter, count, and clear', () => {
  it('filters by light window when filters.lights is set', () => {
    useStore.setState({ filters: { ...EMPTY_FILTERS, lights: ['evening-golden'] } })
    render(<MemoryRouter><BrowseScreen /></MemoryRouter>)
    expect(screen.getByText('Curtis Hixon Waterfront Park')).toBeInTheDocument()
    expect(screen.queryByText('Sacred Heart Catholic Church')).not.toBeInTheDocument()
  })

  it('shows a result count and a dynamic spot total in the placeholder', () => {
    render(<MemoryRouter><BrowseScreen /></MemoryRouter>)
    expect(screen.getByText(/Showing 30 of 30/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/30 Tampa Bay spots/i)).toBeInTheDocument()
  })

  it('shows Clear all only when a filter is active, and it resets', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><BrowseScreen /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Skyline$/ }))
    const clear = await screen.findByRole('button', { name: /clear all/i })
    await user.click(clear)
    expect(useStore.getState().filters.categories).toEqual([])
  })
})
