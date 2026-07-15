import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { MyShortlist } from '../../src/spots/shortlist-api'

/* Signed-in v2 flows: notes on picked spots, stored-list share URL, and the
   Client lists section with responses. Auth is mocked "configured" here; the
   signed-out v1 path is locked by saved-shortlist.test.tsx. */
vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))

const createShortlist = vi.fn(async () => 'list-uuid-9')
const deleteShortlist = vi.fn(async (_id: string) => {})
let myLists: MyShortlist[] = []
vi.mock('../../src/spots/shortlist-api', () => ({
  createShortlist: (...a: unknown[]) => (createShortlist as (...a: unknown[]) => Promise<string>)(...a),
  deleteShortlist: (id: string) => deleteShortlist(id),
  fetchMyShortlists: async () => myLists,
}))

import SavedScreen from '../../src/ui/Saved/SavedScreen'
import YouScreen from '../../src/ui/You/YouScreen'
import { useStore } from '../../src/state/store'
import { useAuth } from '../../src/auth/useAuth'
import { DEFAULT_HOME } from '../../src/data/home.config'

function renderSaved() {
  return render(<MemoryRouter><SavedScreen /></MemoryRouter>)
}
function renderYou() {
  return render(<MemoryRouter><YouScreen /></MemoryRouter>)
}

beforeEach(() => {
  createShortlist.mockClear()
  deleteShortlist.mockClear()
  myLists = []
  useStore.setState({
    home: DEFAULT_HOME, region: 'tampa-bay',
    wishlist: [], visited: [], checklist: {},
    listsSeenAt: null, newClientResponse: false,
  })
  useAuth.setState({ user: { id: 'owner-1', email: 'jon@example.com' }, status: 'ready', errorMsg: null })
})

describe('SavedScreen — signed-in shortlist builder (v2)', () => {
  it('shows a note input per picked spot and shares a stored-list URL', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    useStore.setState({ wishlist: ['bayshore-boulevard', 'independence-hall'] })
    renderSaved()

    await user.click(screen.getByRole('button', { name: /client shortlist/i }))
    expect(screen.queryByLabelText(/note for/i)).not.toBeInTheDocument() // nothing picked yet

    await user.click(screen.getByRole('button', { name: /Bayshore Boulevard/ }))
    const note = screen.getByLabelText('Note for Bayshore Boulevard')
    await user.type(note, 'Golden hour magic here')
    await user.click(screen.getByRole('button', { name: /Independence Hall/ }))

    await user.type(screen.getByPlaceholderText(/list title/i), 'Smith family')
    await user.click(screen.getByRole('button', { name: /share link/i }))

    expect(createShortlist).toHaveBeenCalledWith('Smith family', [
      { id: 'bayshore-boulevard', note: 'Golden hour magic here' },
      { id: 'independence-hall' },
    ])
    expect(writeText).toHaveBeenCalledWith('https://shootvantage.com/l/list-uuid-9')
    expect(await screen.findByText(/link copied/i)).toBeInTheDocument()
  })

  it('nudges sign-in for notes/responses when picking while signed out', async () => {
    const user = userEvent.setup()
    useAuth.setState({ user: null, status: 'ready' })
    useStore.setState({ wishlist: ['bayshore-boulevard'] })
    renderSaved()
    await user.click(screen.getByRole('button', { name: /client shortlist/i }))
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
  })
})

/* Client lists + responses moved from Saved to the You tab (IA redesign 1h):
   responses are notifications, and notifications live on the identity tab. */
describe('YouScreen — client work (lists + responses)', () => {
  const LISTS: MyShortlist[] = [{
    id: 'l1', title: 'Smith family', createdAt: '2026-07-03T20:00:00Z',
    spots: [{ id: 'bayshore-boulevard' }, { id: 'independence-hall', note: 'quiet at dawn' }],
    responses: [{
      id: 'r1', picked: ['independence-hall'], clientName: 'Sarah',
      comment: 'Love this one', createdAt: '2026-07-04T15:00:00Z',
    }],
  }]

  it('lists sent shortlists with their client responses', async () => {
    myLists = LISTS
    renderYou()
    expect(await screen.findByText('CLIENT WORK')).toBeInTheDocument()
    expect(screen.getByText('Smith family')).toBeInTheDocument()
    expect(screen.getByText(/Sarah/)).toBeInTheDocument()
    expect(screen.getByText(/Love this one/)).toBeInTheDocument()
    expect(screen.getByText(/Independence Hall/)).toBeInTheDocument()
  })

  it('marks fresh responses NEW and then records them as seen', async () => {
    myLists = LISTS
    useStore.setState({ listsSeenAt: '2026-07-01T00:00:00Z', newClientResponse: true })
    renderYou()
    expect(await screen.findByText('New')).toBeInTheDocument()
    // Viewing the section clears the badge state (pill stays for this visit).
    expect(useStore.getState().newClientResponse).toBe(false)
    expect(useStore.getState().listsSeenAt).not.toBe('2026-07-01T00:00:00Z')
  })

  it('deletes a list with a two-tap confirm', async () => {
    const user = userEvent.setup()
    myLists = LISTS
    renderYou()
    await screen.findByText('CLIENT WORK')
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(deleteShortlist).not.toHaveBeenCalled() // first tap only arms it
    await user.click(screen.getByRole('button', { name: /confirm delete/i }))
    expect(deleteShortlist).toHaveBeenCalledWith('l1')
  })

  it('keeps the builder entry visible when no lists are sent yet', async () => {
    renderYou()
    expect(await screen.findByRole('button', { name: /new client shortlist/i })).toBeInTheDocument()
    expect(screen.queryByText('Smith family')).not.toBeInTheDocument()
    expect(screen.queryByText(/no response yet/i)).not.toBeInTheDocument()
  })
})
