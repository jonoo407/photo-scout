import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import DayScreen from '../../src/ui/Plan/DayScreen'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

beforeEach(() => { useStore.setState({ home: DEFAULT_HOME, wishlist: [] }) })
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
