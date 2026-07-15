import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

/* Community day one (IA redesign 1j): the next-city scoreboard (B12) plus an
   honest "coming to this tab" card — no fabricated content. */

let totals: Record<string, number> | null = {}
let myVote: string | null = null
const castVote = vi.fn(async (_city: string) => true)
vi.mock('../../src/community/votes-api', () => ({
  fetchVoteTotals: async () => totals,
  fetchMyVote: async () => myVote,
  castVote: (city: string) => castVote(city),
}))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))

import CommunityScreen from '../../src/ui/Community/CommunityScreen'
import { CANDIDATE_CITIES } from '../../src/community/cities'
import { useAuth } from '../../src/auth/useAuth'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

const renderCommunity = () => render(<MemoryRouter><CommunityScreen /></MemoryRouter>)

beforeEach(() => {
  totals = { austin: 412, denver: 388, 'new-orleans': 201 }
  myVote = null
  castVote.mockClear()
  useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay' })
  useAuth.setState({ user: null, status: 'ready', errorMsg: null })
})

describe('candidate cities', () => {
  it('is data-driven with unique ids', () => {
    expect(CANDIDATE_CITIES.length).toBeGreaterThanOrEqual(2)
    expect(new Set(CANDIDATE_CITIES.map((c) => c.id)).size).toBe(CANDIDATE_CITIES.length)
  })
})

describe('Community — next-city scoreboard', () => {
  it('shows live tallies per candidate and the overtake line', async () => {
    renderCommunity()
    expect(await screen.findByText('412')).toBeInTheDocument()
    expect(screen.getByText('388')).toBeInTheDocument()
    expect(screen.getByText('Austin')).toBeInTheDocument()
    expect(screen.getByText('Denver')).toBeInTheDocument()
    expect(screen.getByText('New Orleans')).toBeInTheDocument()
    // B12 playful copy: runner-up gap, computed from real numbers.
    expect(screen.getByText(/Denver needs 25 more votes to overtake Austin/)).toBeInTheDocument()
  })

  it('nudges guests to sign in instead of letting them vote', async () => {
    renderCommunity()
    expect(await screen.findByRole('button', { name: /sign in to vote/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cast your vote/i })).not.toBeInTheDocument()
  })

  it('lets a signed-in user pick a city and casts the vote', async () => {
    const user = userEvent.setup()
    useAuth.setState({ user: { id: 'u1', email: 'jon@example.com' }, status: 'ready', errorMsg: null })
    renderCommunity()
    await user.click(await screen.findByRole('button', { name: /cast your vote/i }))
    await user.click(screen.getByRole('button', { name: 'Denver' }))
    expect(castVote).toHaveBeenCalledWith('denver')
    expect(await screen.findByText(/your vote/i)).toBeInTheDocument()
  })

  it('shows the existing vote and offers to change it', async () => {
    useAuth.setState({ user: { id: 'u1', email: 'jon@example.com' }, status: 'ready', errorMsg: null })
    myVote = 'austin'
    renderCommunity()
    const austinRow = (await screen.findByText('Austin')).closest('.progressrow') as HTMLElement
    expect(within(austinRow).getByText(/your vote/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /change vote/i })).toBeInTheDocument()
  })

  it('degrades gracefully when tallies are unavailable', async () => {
    totals = null
    renderCommunity()
    expect(await screen.findByText(/tallies unavailable/i)).toBeInTheDocument()
  })
})

describe('Community — coming to this tab', () => {
  it('lists discussions and critiques as honestly not-yet-here', async () => {
    renderCommunity()
    expect(await screen.findByText('Spot discussions')).toBeInTheDocument()
    expect(screen.getByText('Photo critiques')).toBeInTheDocument()
    expect(screen.getAllByText('soon')).toHaveLength(2)
  })
})
