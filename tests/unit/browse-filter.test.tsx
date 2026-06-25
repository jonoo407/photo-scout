import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BrowseScreen from '../../src/ui/Browse/BrowseScreen'
import { useStore, EMPTY_FILTERS } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

beforeEach(() => { useStore.setState({ home: DEFAULT_HOME, filters: EMPTY_FILTERS, wishlist: [] }) })

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
