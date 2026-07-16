import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { PointEvent } from '../../src/craft/points'

/* Points come from the server ledger (B11) — mocked here. */
let serverEvents: PointEvent[] = []
vi.mock('../../src/craft/points-api', () => ({
  fetchMyPointEvents: async () => serverEvents,
}))

/* Hunts are DB content — mocked. */
let hunts: Array<Record<string, unknown>> = []
let joins: string[] = []
let progress: Array<{ huntId: string; stopIndex: number; photoPath: string; createdAt: string }> = []
vi.mock('../../src/hunts/hunts-api', () => ({
  fetchHunts: async () => hunts,
  fetchMyHuntState: async () => ({ joins, progress }),
}))

import YouScreen, { initialsFromEmail } from '../../src/ui/You/YouScreen'
import { useStore, EMPTY_FILTERS } from '../../src/state/store'
import { useAuth } from '../../src/auth/useAuth'
import { DEFAULT_HOME } from '../../src/data/home.config'

/* The You tab (IA redesign 1h + 2a): identity space — medallion card over
   stats over client work over the ledger rows. Auth is NOT configured in
   this suite (no env), so it also locks the guest-without-accounts state. */

const ev = (id: string, pts: number): PointEvent =>
  ({ id, at: '2026-07-15T00:00:00.000Z', reason: 'huntStop', pts })

beforeEach(() => {
  serverEvents = []
  hunts = []
  joins = []
  progress = []
  useStore.setState({
    home: DEFAULT_HOME, region: 'tampa-bay', filters: EMPTY_FILTERS,
    wishlist: [], visited: [], checklist: {},
    listsSeenAt: null, newClientResponse: false,
  })
  useAuth.setState({ user: null, status: 'idle', errorMsg: null })
})

const renderYou = () => render(<MemoryRouter><YouScreen /></MemoryRouter>)

describe('initialsFromEmail', () => {
  it('builds two-letter initials from the local part', () => {
    expect(initialsFromEmail('sam.rivera@example.com')).toBe('SR')
    expect(initialsFromEmail('lena-ortiz@example.com')).toBe('LO')
    expect(initialsFromEmail('flahertyjon@gmail.com')).toBe('FL')
    expect(initialsFromEmail(null)).toBe('?')
  })
})

describe('You — medallion card and ladder', () => {
  it('starts at Apprentice with 0 pts and opens the craft ladder sheet', async () => {
    const user = userEvent.setup()
    renderYou()
    const card = screen.getByRole('button', { name: /craft level/i })
    expect(within(card).getByText('Apprentice')).toBeInTheDocument()
    expect(within(card).getByText(/^0 pts$/)).toBeInTheDocument()
    expect(within(card).getByText(/250 pts to Journeyman/)).toBeInTheDocument()

    await user.click(card)
    const sheet = await screen.findByRole('dialog', { name: /craft ladder/i })
    expect(within(sheet).getByText('Master')).toBeInTheDocument()
  })

  it('climbs the ladder as server-ledger points land', async () => {
    serverEvents = [ev('a', 200), ev('b', 200)]
    useAuth.setState({ user: { id: 'u1', email: 'sam.rivera@example.com' }, status: 'ready', errorMsg: null })
    renderYou()
    const card = screen.getByRole('button', { name: /craft level/i })
    expect(await within(card).findByText('Journeyman')).toBeInTheDocument()
    expect(within(card).getByText(/400 pts/)).toBeInTheDocument()
  })

  it('guests always read as Apprentice — the server ledger is not fetched signed out', () => {
    serverEvents = [ev('a', 5000)]
    renderYou()
    const card = screen.getByRole('button', { name: /craft level/i })
    expect(within(card).getByText('Apprentice')).toBeInTheDocument()
  })
})

describe('You — stats and carried-over Saved pieces', () => {
  it('counts saved and been-there in the stats strip', () => {
    useStore.setState({ wishlist: ['bayshore-boulevard', 'independence-hall'], visited: ['fort-de-soto-park'] })
    renderYou()
    const stats = screen.getByRole('region', { name: /your numbers/i })
    expect(within(stats).getByText('2')).toBeInTheDocument()
    expect(within(stats).getByText('1')).toBeInTheDocument()
  })

  it('shows the per-city shot progress once visited (moved from Saved)', () => {
    useStore.setState({ visited: ['bayshore-boulevard'] })
    renderYou()
    const strip = screen.getByRole('region', { name: /shot progress/i })
    expect(within(strip).getByText('Tampa Bay')).toBeInTheDocument()
  })

  it('always offers the hunts hub, and surfaces an active hunt with its progress', async () => {
    // Guest: just the browse entry.
    const guest = renderYou()
    expect(screen.getByRole('button', { name: /photo hunts/i })).toBeInTheDocument()
    guest.unmount()

    // Signed in with an active hunt: named row + progress.
    hunts = [{
      id: 'golden-hour-grand-tour', region: 'tampa-bay', title: 'Golden Hour Grand Tour', blurb: null,
      stops: [{ spotId: 'a', name: 'A', lat: 0, lng: 0 }, { spotId: 'b', name: 'B', lat: 0, lng: 0 }, { spotId: 'c', name: 'C', lat: 0, lng: 0 }],
      stopPts: 25, finishPts: 100, opensAt: null, closesAt: null,
    }]
    joins = ['golden-hour-grand-tour']
    progress = [{ huntId: 'golden-hour-grand-tour', stopIndex: 0, photoPath: 'p', createdAt: '2026-07-15T00:00:00Z' }]
    useAuth.setState({ user: { id: 'u1', email: 'jon@example.com' }, status: 'ready', errorMsg: null })
    renderYou()
    expect(await screen.findByText(/Golden Hour Grand Tour — active/)).toBeInTheDocument()
    expect(screen.getByText(/1 of 3 stops/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /browse all hunts/i })).toBeInTheDocument()
  })

  it('links to Saved spots and Settings; account-only rows stay hidden without auth', () => {
    useStore.setState({ wishlist: ['bayshore-boulevard'] })
    renderYou()
    expect(screen.getByRole('button', { name: /saved spots/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    expect(screen.queryByText(/client work/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/your shots/i)).not.toBeInTheDocument()
  })
})
