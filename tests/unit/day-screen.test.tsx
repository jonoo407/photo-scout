import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import DayScreen from '../../src/ui/Plan/DayScreen'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

beforeEach(() => { useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay', wishlist: [], savedPlans: [] }) })
afterEach(() => { vi.restoreAllMocks() })

function renderDay(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes><Route path="/day" element={<DayScreen />} /></Routes>
    </MemoryRouter>,
  )
}

describe('DayScreen', () => {
  it('builds a multi-stop itinerary of distinct spots', () => {
    renderDay('/day')
    // morning + evening at least; the old version collapsed to one repeated spot
    expect(screen.getByText('Your day')).toBeInTheDocument()
    expect(screen.getAllByText(/min$/).length).toBeGreaterThanOrEqual(2)
  })

  it('shows the drive from home to the first stop (and no bare "0 min" leg)', () => {
    renderDay('/day')
    // The home → first-stop leg must be visible, not just hidden inside the total.
    expect(screen.getByText(/from home/i)).toBeInTheDocument()
    // A 0-minute drive should never render as the wonky "drive 0 min".
    expect(screen.queryByText(/\bdrive 0 min\b/i)).not.toBeInTheDocument()
  })

  it('plans around an anchor spot and flags it', () => {
    renderDay('/day?anchor=dali-museum')
    expect(screen.getByText('The Dalí Museum')).toBeInTheDocument()
    expect(screen.getByText(/your anchor/i)).toBeInTheDocument()
  })

  it('swap opens a ranked chooser and applies the picked spot', async () => {
    const user = userEvent.setup()
    renderDay('/day')
    // Ballast Point isn't the default morning pick (Bayshore is, nearer home)
    expect(screen.queryByText('Ballast Point Park')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /swap sunrise & morning golden/i }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByText('Ballast Point Park'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Ballast Point Park')).toBeInTheDocument()
  })

  it('explains how the smart build picks (feedback #4)', () => {
    renderDay('/day')
    expect(screen.getByText(/light window.*open.*drive|matched to its light/i)).toBeInTheDocument()
  })

  it('swap chooser shows rich spot cards, not bare rows (feedback #4)', async () => {
    const user = userEvent.setup()
    renderDay('/day')
    await user.click(screen.getByRole('button', { name: /swap sunrise & morning golden/i }))
    const dialog = await screen.findByRole('dialog')
    // why-line from bestFor, the same card language as everywhere else
    expect(within(dialog).getAllByText(/sunrise over the bay/).length).toBeGreaterThan(0)
    // the current pick is badged with the app's pick pattern
    expect(within(dialog).getAllByText(/current/i).length).toBeGreaterThan(0)
  })

  it('shows a weather indicator on stops when rain is forecast', async () => {
    // one hourly entry with 90% precip → every block resolves rainy
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ hourly: { time: [1750000000], precipitation_probability: [90], cloud_cover: [95] } }),
    })) as unknown as typeof fetch
    renderDay('/day')
    const chips = await screen.findAllByText(/rain likely/i)
    expect(chips.length).toBeGreaterThan(0)
  })
})

describe('DayScreen — save & share (plans persist, feedback #5/#6)', () => {
  it('saves the built day (with any swaps) to the store', async () => {
    const user = userEvent.setup()
    renderDay('/day')
    await user.click(screen.getByRole('button', { name: /save plan/i }))
    const plans = useStore.getState().savedPlans
    expect(plans).toHaveLength(1)
    expect(plans[0].stops.length).toBeGreaterThanOrEqual(2)
    expect(plans[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(await screen.findByText(/saved/i)).toBeInTheDocument()
  })

  it('shares the day as a canonical plan link', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderDay('/day')
    await user.click(screen.getByRole('button', { name: /share plan/i }))
    expect(writeText).toHaveBeenCalledTimes(1)
    const url = String((writeText.mock.calls[0] as unknown[])[0])
    expect(url).toMatch(/^https:\/\/shootvantage\.com\/#\/day\?date=\d{4}-\d{2}-\d{2}&stops=/)
  })
})

describe('DayScreen — pinned mode (opened from a saved/shared link)', () => {
  const PINNED = '/day?date=2026-07-12&stops=sunrise:bayshore-boulevard,sunset:honeymoon-island-sp'

  it('renders exactly the linked spots with no swap buttons', async () => {
    renderDay(PINNED)
    expect(await screen.findByText('Bayshore Boulevard')).toBeInTheDocument()
    expect(screen.getByText('Honeymoon Island State Park')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /swap/i })).not.toBeInTheDocument()
  })

  it('names the planned day, not "today"', async () => {
    renderDay(PINNED)
    expect((await screen.findAllByText(/jul 12/i)).length).toBeGreaterThan(0)
    expect(screen.queryByText(/· today/i)).not.toBeInTheDocument()
  })
})
