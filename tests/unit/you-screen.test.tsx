import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import YouScreen, { initialsFromEmail } from '../../src/ui/You/YouScreen'
import { useStore, EMPTY_FILTERS } from '../../src/state/store'
import { useAuth } from '../../src/auth/useAuth'
import { DEFAULT_HOME } from '../../src/data/home.config'
import type { PointEvent } from '../../src/craft/points'

/* The You tab (IA redesign 1h + 2a): identity space — medallion card over
   stats over client work over the ledger rows. Auth is NOT configured in
   this suite (no env), so it also locks the guest-without-accounts state. */

const ev = (id: string, pts: number): PointEvent =>
  ({ id, at: '2026-07-15T00:00:00.000Z', reason: 'huntStop', pts })

beforeEach(() => {
  useStore.setState({
    home: DEFAULT_HOME, region: 'tampa-bay', filters: EMPTY_FILTERS,
    wishlist: [], visited: [], checklist: {}, pointEvents: [],
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

  it('climbs the ladder as ledger points land', () => {
    useStore.setState({ pointEvents: [ev('a', 200), ev('b', 200)] })
    renderYou()
    const card = screen.getByRole('button', { name: /craft level/i })
    expect(within(card).getByText('Journeyman')).toBeInTheDocument()
    expect(within(card).getByText(/400 pts/)).toBeInTheDocument()
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

  it('links to Saved spots and Settings; account-only rows stay hidden without auth', () => {
    useStore.setState({ wishlist: ['bayshore-boulevard'] })
    renderYou()
    expect(screen.getByRole('button', { name: /saved spots/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    expect(screen.queryByText(/client work/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/your shots/i)).not.toBeInTheDocument()
  })
})
