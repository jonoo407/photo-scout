import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/* The sign-in gate (V4, decided 2026-09-14): every tab screen needs an
   account. Jon's call — "we need sign in, but make it as easy as possible":
   Google, or an email and a password, and you are in. No guest mode, no
   "continue without an account" footnote. The chrome-free client list
   (/list) stays outside the gate; it is what a CLIENT opens. */

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

const USER = { id: '11111111-2222-4333-8444-555555555555', email: 'jon@example.test' }

const gate = () => render(
  <MemoryRouter><AuthGate><p>the app</p></AuthGate></MemoryRouter>,
)

beforeEach(() => {
  mocks.available = true
  localStorage.clear()
  useAuth.setState({ user: null, status: 'idle', errorMsg: null, linkError: null, recovery: false })
})
afterEach(() => { vi.useRealTimers() })

describe('AuthGate', () => {
  it('lets everything through when auth is not configured (dev without env)', () => {
    mocks.available = false
    gate()
    expect(screen.getByText('the app')).toBeInTheDocument()
  })

  it('holds a splash — not the sign-in form — while the stored session is being restored', () => {
    gate()
    expect(screen.queryByText('the app')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /know where the light is/i })).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: /vantage/i })).toBeInTheDocument()
  })

  it('shows the sign-in screen when nobody is signed in', () => {
    useAuth.setState({ status: 'ready' })
    gate()
    expect(screen.getByRole('heading', { name: /know where the light is/i })).toBeInTheDocument()
    expect(screen.queryByText('the app')).not.toBeInTheDocument()
  })

  it('shows the app once signed in', () => {
    useAuth.setState({ status: 'ready', user: USER })
    gate()
    expect(screen.getByText('the app')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /know where the light is/i })).not.toBeInTheDocument()
  })

  it('asks for a new password when a reset link brought us here — before the app', () => {
    useAuth.setState({ status: 'ready', user: USER, recovery: true })
    gate()
    expect(screen.getByRole('heading', { name: /choose a new password/i })).toBeInTheDocument()
    expect(screen.queryByText('the app')).not.toBeInTheDocument()
  })

  it('does not leave anyone on the splash forever if the session never resolves', () => {
    vi.useFakeTimers()
    gate()
    act(() => { vi.advanceTimersByTime(6500) })
    expect(screen.getByRole('heading', { name: /know where the light is/i })).toBeInTheDocument()
  })
})

describe('Layout wears the gate', () => {
  it('signed out: the sign-in screen, and no tab bar to wander off with', () => {
    useAuth.setState({ status: 'ready' })
    render(<MemoryRouter><Layout /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /know where the light is/i })).toBeInTheDocument()
    expect(document.querySelector('nav.tabbar')).toBeNull()
  })

  it('signed in: the five tabs as before', () => {
    useAuth.setState({ status: 'ready', user: USER })
    render(<MemoryRouter><Layout /></MemoryRouter>)
    expect(document.querySelectorAll('nav.tabbar a')).toHaveLength(5)
  })
})
