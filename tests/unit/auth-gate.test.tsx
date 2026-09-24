import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

/* Guest browsing (G1, 2026-09-24) — reverses the 2026-09-14 hard gate, which
   put a sign-in screen in front of every tab: shared spot and plan links, SEO
   and App Store 5.1.1(v) all broke on it. Now every tab browses signed out;
   an account is asked for with a sheet (design 4b) only at the actions that
   need one. What still stands in front of the app is a password-reset link. */

const mocks = vi.hoisted(() => ({ available: true }))
vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => mocks.available,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))
vi.mock('../../src/pwa/native', () => ({ isNativeApp: () => false }))

import AuthGate from '../../src/ui/Login/AuthGate'
import Layout from '../../src/ui/Layout'
import { useAuth } from '../../src/auth/useAuth'
import { requireSignIn, dismissSignIn, useSignInPrompt } from '../../src/auth/sign-in-prompt'

const USER = { id: '11111111-2222-4333-8444-555555555555', email: 'jon@example.test' }
const signUpWithPassword = vi.fn(async () => {})
const clearStatus = vi.fn(() => useAuth.setState({ status: 'ready', errorMsg: null }))

const gate = () => render(
  <MemoryRouter><AuthGate><p>the app</p></AuthGate></MemoryRouter>,
)

// jsdom has no scrolling; Layout's ScrollReset calls it on every route.
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), configurable: true })

beforeEach(() => {
  vi.clearAllMocks()
  mocks.available = true
  localStorage.clear()
  dismissSignIn()
  useAuth.setState({
    user: null, status: 'ready', errorMsg: null, linkError: null, recovery: false,
    signUpWithPassword, clearStatus,
  })
})

describe('AuthGate', () => {
  it('lets everything through when auth is not configured (dev without env)', () => {
    mocks.available = false
    gate()
    expect(screen.getByText('the app')).toBeInTheDocument()
  })

  it('signed out: the app, not a sign-in screen', () => {
    gate()
    expect(screen.getByText('the app')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /know where the light is/i })).not.toBeInTheDocument()
  })

  it('does not hold the app behind a splash while the session restores', () => {
    useAuth.setState({ status: 'idle' })
    gate()
    expect(screen.getByText('the app')).toBeInTheDocument()
  })

  it('signed in: the app', () => {
    useAuth.setState({ user: USER })
    gate()
    expect(screen.getByText('the app')).toBeInTheDocument()
  })

  it('asks for a new password when a reset link brought us here — before the app', () => {
    useAuth.setState({ user: USER, recovery: true })
    gate()
    expect(screen.getByRole('heading', { name: /choose a new password/i })).toBeInTheDocument()
    expect(screen.queryByText('the app')).not.toBeInTheDocument()
  })
})

describe('Layout — guests browse', () => {
  const layout = () => render(<MemoryRouter><Layout /></MemoryRouter>)

  it('signed out: the five tabs, and no sign-in anything until an action asks', () => {
    layout()
    expect(document.querySelectorAll('nav.tabbar a')).toHaveLength(5)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument()
  })

  it('signed in: the five tabs as before', () => {
    useAuth.setState({ user: USER })
    layout()
    expect(document.querySelectorAll('nav.tabbar a')).toHaveLength(5)
  })

  it('an action that needs an account opens the sheet, naming what is at stake', () => {
    layout()
    act(() => { requireSignIn('hunt', undefined, 'Join Golden Hour Grand Tour') })
    const sheet = screen.getByRole('dialog', { name: /save your progress first/i })
    expect(within(sheet).getByText('Join Golden Hour Grand Tour')).toBeInTheDocument()
    expect(within(sheet).getByText(/stops, points and your finish bonus/i)).toBeInTheDocument()
    expect(within(sheet).getByLabelText(/^email$/i)).toBeInTheDocument()
    // Still on the same screen underneath — context is the pitch.
    expect(document.querySelectorAll('nav.tabbar a')).toHaveLength(5)
  })

  it('"Not now" goes back to browsing and drops the pending action', async () => {
    const u = userEvent.setup()
    const action = vi.fn()
    layout()
    act(() => { requireSignIn('save', action) })
    await u.click(screen.getByRole('button', { name: /not now/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    act(() => useAuth.setState({ user: USER }))
    expect(action).not.toHaveBeenCalled()
  })

  it('Escape and a tap on the scrim close it too', async () => {
    const u = userEvent.setup()
    layout()
    act(() => { requireSignIn('vote') })
    await u.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    act(() => { requireSignIn('vote') })
    await u.click(document.querySelector('.sheet-backdrop')!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closing clears a stale error so it cannot greet the next prompt', async () => {
    const u = userEvent.setup()
    useAuth.setState({ status: 'error', errorMsg: 'That email or password is wrong.' })
    layout()
    act(() => { requireSignIn('rate') })
    await u.click(screen.getByRole('button', { name: /not now/i }))
    expect(clearStatus).toHaveBeenCalled()
  })

  it('signing in from the sheet closes it and finishes what was tapped', async () => {
    const u = userEvent.setup()
    const action = vi.fn()
    layout()
    act(() => { requireSignIn('save', action, 'Bayshore Boulevard') })
    const sheet = screen.getByRole('dialog')
    await u.type(within(sheet).getByLabelText(/^email$/i), 'new@example.test')
    await u.type(within(sheet).getByLabelText(/^password$/i), 'a-long-password')
    await u.click(within(sheet).getByRole('button', { name: /create account/i }))
    expect(signUpWithPassword).toHaveBeenCalledWith('new@example.test', 'a-long-password')

    // The session lands (onAuthStateChange sets the user).
    act(() => useAuth.setState({ user: USER }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(action).toHaveBeenCalledTimes(1)
    expect(useSignInPrompt.getState().reason).toBeNull()
  })
})
