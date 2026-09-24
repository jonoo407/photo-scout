import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'

/* The soft gate at each call site (G1). Browsing never asks; these do —
   save (want/been/plan), alerts, upload, client shortlist — and each one
   either finishes the tap after sign-in or, where the browser needs a fresh
   gesture (notification prompt, picker, share sheet), waits for the next tap. */

const mocks = vi.hoisted(() => ({
  enableConditionAlerts: vi.fn(async () => true),
  createShortlist: vi.fn(async () => 'list-uuid-1'),
}))
vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))
vi.mock('../../src/spots/community-photos-api', () => ({
  fetchSpotCommunityPhotos: async () => [],
  ratePhoto: async () => ({ ok: true, count: 1, avg: 5 }),
}))
vi.mock('../../src/spots/photos-api', () => ({
  listMyPhotos: async () => [],
  listAllMyPhotos: async () => [],
  sweepMyOrphanPhotos: async () => 0,
  uploadSpotPhoto: vi.fn(),
  deleteSpotPhoto: vi.fn(),
}))
vi.mock('../../src/craft/points-api', () => ({ fetchMyPointEvents: async () => [] }))
vi.mock('../../src/hunts/hunts-api', () => ({
  fetchHunts: async () => [],
  fetchMyHuntState: async () => ({ joins: [], progress: [] }),
}))
vi.mock('../../src/push/client', () => ({
  pushSupported: () => true,
  alertsEnabled: async () => false,
  enableConditionAlerts: mocks.enableConditionAlerts,
  disableConditionAlerts: vi.fn(async () => {}),
}))
vi.mock('../../src/spots/shortlist-api', () => ({
  createShortlist: mocks.createShortlist,
  fetchMyShortlists: async () => [],
  refreshResponsesBadge: async () => {},
}))

import SpotDetailScreen from '../../src/ui/SpotDetail/SpotDetailScreen'
import DayScreen from '../../src/ui/Plan/DayScreen'
import AlertsSection from '../../src/ui/Settings/AlertsSection'
import SavedScreen from '../../src/ui/Saved/SavedScreen'
import YouScreen from '../../src/ui/You/YouScreen'
import YourShotsScreen from '../../src/ui/You/YourShotsScreen'
import { useAuth } from '../../src/auth/useAuth'
import { useStore } from '../../src/state/store'
import { useSignInPrompt, dismissSignIn } from '../../src/auth/sign-in-prompt'
import { DEFAULT_HOME } from '../../src/data/home.config'

const USER = { id: 'u1', email: 'jon@example.com' }
const signIn = () => act(() => useAuth.setState({ user: USER }))
const prompt = () => useSignInPrompt.getState()

function Where() {
  const loc = useLocation()
  return <p>now at {loc.pathname}{loc.search}</p>
}
const at = (path: string, route: string, el: React.ReactNode) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path={route} element={el} />
      <Route path="*" element={<Where />} />
    </Routes>
  </MemoryRouter>,
)

Object.defineProperty(window, 'scrollTo', { value: vi.fn(), configurable: true })

beforeEach(() => {
  vi.clearAllMocks()
  dismissSignIn()
  useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay', wishlist: [], visited: [], savedPlans: [], checklist: {} })
  useAuth.setState({ user: null, status: 'ready', errorMsg: null, linkError: null, recovery: false })
})

describe('spot page — Want to go / Been there', () => {
  const spot = () => at('/spot/bayshore-boulevard', '/spot/:id', <SpotDetailScreen />)

  it('a guest reads the whole page; saving asks, naming the spot', async () => {
    const u = userEvent.setup()
    spot()
    expect(screen.getByRole('heading', { name: 'Bayshore Boulevard' })).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: /want to go/i }))
    expect(useStore.getState().wishlist).toEqual([])
    expect(prompt()).toMatchObject({ reason: 'save', context: 'Bayshore Boulevard' })
  })

  it('once signed in, the save that asked is made', async () => {
    const u = userEvent.setup()
    spot()
    await u.click(screen.getByRole('button', { name: /want to go/i }))
    signIn()
    expect(useStore.getState().wishlist).toEqual(['bayshore-boulevard'])
    expect(screen.getByRole('button', { name: /on your list/i })).toBeInTheDocument()
  })

  it('the replayed save adds, never toggles — a merge that got there first stays saved', async () => {
    const u = userEvent.setup()
    spot()
    await u.click(screen.getByRole('button', { name: /been there/i }))
    act(() => useStore.setState({ visited: ['bayshore-boulevard'] }))
    signIn()
    expect(useStore.getState().visited).toEqual(['bayshore-boulevard'])
  })

  it('un-saving never asks', async () => {
    const u = userEvent.setup()
    useStore.setState({ wishlist: ['bayshore-boulevard'] })
    spot()
    await u.click(screen.getByRole('button', { name: /on your list/i }))
    expect(useStore.getState().wishlist).toEqual([])
    expect(prompt().reason).toBeNull()
  })

  it('signed in: saves at once, as before', async () => {
    const u = userEvent.setup()
    useAuth.setState({ user: USER })
    spot()
    await u.click(screen.getByRole('button', { name: /been there/i }))
    expect(useStore.getState().visited).toEqual(['bayshore-boulevard'])
    expect(prompt().reason).toBeNull()
  })

  it('upload asks for an account in place, rather than bouncing to Settings', async () => {
    const u = userEvent.setup()
    spot()
    await u.click(screen.getByRole('button', { name: /sign in to add your shots/i }))
    expect(prompt()).toMatchObject({ reason: 'upload', pending: null })
    expect(screen.getByRole('heading', { name: 'Bayshore Boulevard' })).toBeInTheDocument()
  })
})

describe('day plan — Save plan', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date(2026, 5, 25, 4, 30) }) })
  afterEach(() => { vi.useRealTimers() })

  it('a guest can build and read the plan; saving asks, then saves it', async () => {
    const u = userEvent.setup()
    at('/day', '/day', <DayScreen />)
    expect(screen.getByText('Your day')).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: /save plan/i }))
    expect(useStore.getState().savedPlans).toHaveLength(0)
    expect(prompt().reason).toBe('save')

    signIn()
    expect(useStore.getState().savedPlans).toHaveLength(1)
    expect(screen.getByRole('button', { name: /saved to plan/i })).toBeInTheDocument()
  })

  it('sharing the plan link never asks — the link is the growth loop', async () => {
    const u = userEvent.setup()
    at('/day', '/day', <DayScreen />)
    await u.click(screen.getByRole('button', { name: /share plan/i }))
    expect(prompt().reason).toBeNull()
  })
})

describe('Settings — conditions alerts', () => {
  it('turning on asks first, and waits for a fresh tap (the permission prompt needs one)', async () => {
    const u = userEvent.setup()
    useStore.setState({ wishlist: ['honeymoon-island-sp'] })
    render(<AlertsSection />)
    await u.click(await screen.findByRole('button', { name: /turn on/i }))
    expect(mocks.enableConditionAlerts).not.toHaveBeenCalled()
    expect(prompt()).toMatchObject({ reason: 'alerts', pending: null })

    signIn()
    expect(mocks.enableConditionAlerts).not.toHaveBeenCalled()
    await u.click(screen.getByRole('button', { name: /turn on/i }))
    expect(mocks.enableConditionAlerts).toHaveBeenCalledWith(['honeymoon-island-sp'])
  })
})

describe('client shortlist', () => {
  it('a guest can pick spots; sending asks, and creates nothing until signed in', async () => {
    const u = userEvent.setup()
    useStore.setState({ wishlist: ['bayshore-boulevard'] })
    at('/you/saved', '/you/saved', <SavedScreen />)
    await u.click(await screen.findByRole('button', { name: /client shortlist/i }))
    expect(screen.getByText(/sending asks you to sign in/i)).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: /Bayshore Boulevard/ }))
    await u.click(screen.getByRole('button', { name: /share link/i }))
    expect(mocks.createShortlist).not.toHaveBeenCalled()
    expect(prompt()).toMatchObject({ reason: 'share', pending: null })

    signIn()
    expect(screen.getByLabelText('Note for Bayshore Boulevard')).toBeInTheDocument()
  })
})

describe('You', () => {
  it('a guest sees they are browsing as one, and a way in that comes back to You', async () => {
    const u = userEvent.setup()
    at('/you', '/you', <YouScreen />)
    expect(screen.getByText(/browsing as a guest/i)).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(screen.getByText('now at /signin?next=%2Fyou')).toBeInTheDocument()
  })

  it('no guest line while the stored session is restoring', () => {
    useAuth.setState({ status: 'idle' })
    at('/you', '/you', <YouScreen />)
    expect(screen.queryByText(/browsing as a guest/i)).not.toBeInTheDocument()
  })

  it('Your shots: a guest gets a way in, in place', async () => {
    const u = userEvent.setup()
    at('/you/shots', '/you/shots', <YourShotsScreen />)
    expect(screen.getByText('Sign in to keep shots')).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(prompt().reason).toBe('upload')
  })
})
