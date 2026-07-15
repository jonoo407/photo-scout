import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TodayScreen from '../../src/ui/Today/TodayScreen'
import { useStore, EMPTY_FILTERS } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

/* Today absorbs Plan's sun/moon reference table as a collapsible card
   (IA redesign 1d) — daily reference data on the daily screen. */

beforeEach(() => {
  useStore.setState({
    home: DEFAULT_HOME, region: 'tampa-bay', units: 'imperial',
    wishlist: [], filters: EMPTY_FILTERS, sunTableCollapsed: false,
  })
  global.fetch = vi.fn(async () => { throw new Error('offline') }) as unknown as typeof fetch
})
afterEach(() => { vi.restoreAllMocks() })

describe('Today — sun & moon times (from Plan)', () => {
  it('renders the full table: all eight light rows plus the moon', () => {
    render(<MemoryRouter><TodayScreen /></MemoryRouter>)
    expect(screen.getByText(/sun & moon times/i)).toBeInTheDocument()
    for (const label of [
      'Morning blue hour', 'Sunrise', 'Morning golden', 'Solar noon',
      'Evening golden', 'Sunset', 'Evening blue hour', 'Night / astro',
    ]) expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.getByText(/^Moon \d+%/)).toBeInTheDocument()
    // The old five-row "Today's light" card is gone, not duplicated.
    expect(screen.queryByText(/today's light/i)).not.toBeInTheDocument()
  })

  it('collapses to just the header row and remembers the choice', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><TodayScreen /></MemoryRouter>)
    const toggle = screen.getByRole('button', { name: /sun & moon times/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Solar noon')).not.toBeInTheDocument()
    expect(useStore.getState().sunTableCollapsed).toBe(true)
  })

  it('starts collapsed when the stored preference says so', () => {
    useStore.setState({ sunTableCollapsed: true })
    render(<MemoryRouter><TodayScreen /></MemoryRouter>)
    expect(screen.queryByText('Solar noon')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sun & moon times/i })).toHaveAttribute('aria-expanded', 'false')
  })
})
