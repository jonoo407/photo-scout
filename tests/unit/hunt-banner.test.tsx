import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Hunt, HuntProgressRow } from '../../src/hunts/hunts'

/* The hunt-stop banner on spot pages (handoff 2f) — a discovery surface:
   spots that are hunt stops advertise the hunt. */

let hunts: Hunt[] = []
let joins: string[] = []
let progress: HuntProgressRow[] = []
vi.mock('../../src/hunts/hunts-api', () => ({
  fetchHunts: async () => hunts,
  fetchMyHuntState: async () => ({ joins, progress }),
}))

import HuntSpotBanner from '../../src/ui/Hunts/HuntSpotBanner'
import { useAuth } from '../../src/auth/useAuth'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

const TOUR: Hunt = {
  id: 'golden-hour-grand-tour', region: 'tampa-bay', title: 'Golden Hour Grand Tour', blurb: null,
  stops: [
    { spotId: 'bayshore-boulevard', name: 'Bayshore Boulevard', lat: 27.9165, lng: -82.4827 },
    { spotId: 'tampa-riverwalk', name: 'Tampa Riverwalk', lat: 27.9468, lng: -82.4618 },
  ],
  stopPts: 25, finishPts: 100, opensAt: null, closesAt: null,
}

beforeEach(() => {
  hunts = [TOUR]
  joins = []
  progress = []
  useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay' })
  useAuth.setState({ user: null, status: 'ready', errorMsg: null })
})

describe('HuntSpotBanner', () => {
  it('advertises the hunt on stop spots with the stop points', async () => {
    render(<MemoryRouter><HuntSpotBanner spotId="bayshore-boulevard" /></MemoryRouter>)
    expect(await screen.findByText(/Golden Hour Grand Tour/)).toBeInTheDocument()
    expect(screen.getByText(/\+25/)).toBeInTheDocument()
  })

  it('renders nothing on spots that are not hunt stops', async () => {
    const { container } = render(<MemoryRouter><HuntSpotBanner spotId="sunken-gardens" /></MemoryRouter>)
    await new Promise((r) => setTimeout(r, 50))
    expect(container.textContent).toBe('')
  })

  it('switches to progress copy once the user hunts here', async () => {
    useAuth.setState({ user: { id: 'u-1', email: 'jon@example.com' }, status: 'ready', errorMsg: null })
    joins = [TOUR.id]
    render(<MemoryRouter><HuntSpotBanner spotId="tampa-riverwalk" /></MemoryRouter>)
    expect(await screen.findByText(/stop 2 of 2/i)).toBeInTheDocument()
  })
})
