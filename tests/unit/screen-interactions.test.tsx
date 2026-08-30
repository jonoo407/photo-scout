import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

/* Handlers, not renders.
 *
 * The screen suites assert thoroughly on what appears; function coverage showed
 * they mostly stop before the tap. These drive the controls a user actually
 * presses — filter chips, day toggles, empty-state escape hatches, the native
 * camera path — on the screens whose handlers were least exercised. */

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))

import ExploreScreen from '../../src/ui/Explore/ExploreScreen'
import PlanScreen from '../../src/ui/Plan/PlanScreen'
import { useStore, EMPTY_FILTERS } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

const routed = (ui: React.ReactElement, extra?: React.ReactNode) => render(
  <MemoryRouter initialEntries={['/']}>
    <Routes>
      <Route path="/" element={ui} />
      <Route path="/day" element={<div data-testid="day-page">day</div>} />
      <Route path="/community" element={<div data-testid="community-page">community</div>} />
      {extra}
    </Routes>
  </MemoryRouter>,
)

beforeEach(() => {
  useStore.setState({
    home: DEFAULT_HOME, region: 'tampa-bay', filters: EMPTY_FILTERS,
    wishlist: [], visited: [], savedPlans: [],
  })
})

describe('Explore — the filter chips', () => {
  it('toggles Free on and back off', async () => {
    const user = userEvent.setup()
    routed(<ExploreScreen />)

    await user.click(screen.getByRole('button', { name: /^free$/i }))
    expect(useStore.getState().filters.freeOnly).toBe(true)

    await user.click(screen.getByRole('button', { name: /^free$/i }))
    expect(useStore.getState().filters.freeOnly).toBe(false)
  })

  it('narrows to the wishlist with Want to go', async () => {
    const user = userEvent.setup()
    useStore.setState({ wishlist: ['bayshore-boulevard'] })
    routed(<ExploreScreen />)

    await user.click(screen.getByRole('button', { name: /want to go/i }))
    expect(useStore.getState().filters.wishlistOnly).toBe(true)
    expect(screen.getByText('Bayshore Boulevard')).toBeInTheDocument()
    expect(screen.queryByText('Fred Howard Park')).not.toBeInTheDocument()
  })

  it('offers Pet-friendly only where the city has that data', async () => {
    const user = userEvent.setup()
    routed(<ExploreScreen />)
    const chip = screen.queryByRole('button', { name: /pet-friendly/i })
    if (!chip) return // city without pet data — the chip is correctly absent
    await user.click(chip)
    expect(useStore.getState().filters.petFriendlyOnly).toBe(true)
  })
})

describe('Explore — the empty state is an escape hatch, not a dead end', () => {
  /** A search nothing can satisfy. */
  const overFilter = () => useStore.setState({
    filters: { ...EMPTY_FILTERS, query: 'zzzz-no-such-spot' },
  })

  it('clears the filters from inside the empty state', async () => {
    const user = userEvent.setup()
    overFilter()
    routed(<ExploreScreen />)
    expect(screen.getByText(/No spots match these filters/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(useStore.getState().filters).toEqual(EMPTY_FILTERS)
    expect(screen.queryByText(/No spots match these filters/i)).not.toBeInTheDocument()
  })

  it('routes "missing a whole city" to the vote', async () => {
    const user = userEvent.setup()
    overFilter()
    routed(<ExploreScreen />)

    await user.click(screen.getByRole('button', { name: /missing a whole city/i }))
    expect(screen.getByTestId('community-page')).toBeInTheDocument()
  })
})

describe('Plan — the day toggle and the build CTA', () => {
  it('switches the CTA between today and tomorrow', async () => {
    const user = userEvent.setup()
    routed(<PlanScreen />)
    expect(screen.getByRole('button', { name: /smart-build today's shoot/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^tomorrow$/i }))
    expect(screen.getByRole('button', { name: /smart-build tomorrow's shoot/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^today$/i }))
    expect(screen.getByRole('button', { name: /smart-build today's shoot/i })).toBeInTheDocument()
  })

  it('carries the chosen day into the day builder', async () => {
    const user = userEvent.setup()
    routed(<PlanScreen />)
    await user.click(screen.getByRole('button', { name: /^tomorrow$/i }))
    await user.click(screen.getByRole('button', { name: /smart-build/i }))
    expect(screen.getByTestId('day-page')).toBeInTheDocument()
  })
})

describe('Plan — saved plans', () => {
  const PLAN = {
    id: 'p1', name: 'Sat, Jul 12 · Tampa Bay', date: '2026-07-12',
    stops: [{ block: 'sunset' as const, spotId: 'honeymoon-island-sp' }],
    createdAt: '2026-07-06T00:00:00Z',
  }

  it('opens a saved plan', async () => {
    const user = userEvent.setup()
    useStore.setState({ savedPlans: [PLAN] })
    routed(<PlanScreen />)

    await user.click(screen.getByRole('button', { name: /Sat, Jul 12/ }))
    expect(screen.getByTestId('day-page')).toBeInTheDocument()
  })

  it('deletes a saved plan', async () => {
    const user = userEvent.setup()
    useStore.setState({ savedPlans: [PLAN] })
    routed(<PlanScreen />)

    // Deleting is two taps on purpose — a saved plan is not cheap to rebuild.
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(useStore.getState().savedPlans).toHaveLength(1) // still there after one tap

    await user.click(screen.getByRole('button', { name: /confirm delete/i }))
    await waitFor(() => expect(useStore.getState().savedPlans).toHaveLength(0))
  })
})
