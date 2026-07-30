import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

/* IntroCard's "Use my location" (tester report, build 15).

   It called navigator.geolocation directly — the interface that NEVER calls
   back inside the iOS webview (the exact bug position.ts exists to fix, and
   documents). On a phone it looked like it worked because the failure path
   advanced to the next step anyway; it just silently never located anyone.
   It must go through getPosition, the platform-aware path. */

const mocks = vi.hoisted(() => ({
  getPosition: vi.fn(async () => ({ lat: 27.9506, lng: -82.4572 })), // Tampa
}))
vi.mock('../../src/geo/position', () => ({ getPosition: mocks.getPosition }))

import IntroCard from '../../src/ui/Today/IntroCard'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getPosition.mockResolvedValue({ lat: 27.9506, lng: -82.4572 })
  useStore.setState({ introSeen: false, region: 'philadelphia', home: DEFAULT_HOME, wishlist: [] })
})

describe('IntroCard — Use my location', () => {
  it('locates through the platform-aware path, not raw browser geolocation', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><IntroCard /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /use my location/i }))
    expect(mocks.getPosition).toHaveBeenCalled()
  })

  it('sets the nearest city and home, then advances', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><IntroCard /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /use my location/i }))
    expect(await screen.findByText(/tap what you'd love to shoot/i)).toBeInTheDocument()
    expect(useStore.getState().region).toBe('tampa-bay')
    expect(useStore.getState().home.label).toBe('Current location')
  })

  it('still advances when locating fails — the intro must never dead-end', async () => {
    const user = userEvent.setup()
    mocks.getPosition.mockRejectedValueOnce(new Error('denied'))
    render(<MemoryRouter><IntroCard /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /use my location/i }))
    expect(await screen.findByText(/tap what you'd love to shoot/i)).toBeInTheDocument()
    expect(useStore.getState().region).toBe('philadelphia') // untouched on failure
  })
})
