import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

/* requireSignIn — the soft gate's one entry point (G1) — and the route stash
   that brings a Google sign-in back to the screen it left. */

const mocks = vi.hoisted(() => ({ available: true }))
vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => mocks.available,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))

import { useAuth } from '../../src/auth/useAuth'
import {
  requireSignIn, needsSignIn, dismissSignIn, useSignInPrompt, useIsGuest, safeNext, signInPath,
} from '../../src/auth/sign-in-prompt'
import { rememberReturn, takeReturn, restoreReturn } from '../../src/auth/return-to'

const USER = { id: 'u1', email: 'jon@example.test' }

beforeEach(() => {
  mocks.available = true
  dismissSignIn()
  sessionStorage.clear()
  useAuth.setState({ user: null, status: 'ready' })
  window.history.replaceState(null, '', '/')
})

describe('requireSignIn', () => {
  it('signed in: runs the action now and says so', () => {
    useAuth.setState({ user: USER })
    const action = vi.fn()
    expect(requireSignIn('save', action)).toBe(true)
    expect(action).toHaveBeenCalledTimes(1)
    expect(useSignInPrompt.getState().reason).toBeNull()
  })

  it('auth not configured: nothing is gated — the app is local-first', () => {
    mocks.available = false
    const action = vi.fn()
    expect(needsSignIn()).toBe(false)
    expect(requireSignIn('upload', action)).toBe(true)
    expect(action).toHaveBeenCalled()
  })

  it('signed out: opens the prompt with its reason and context, and holds the action', () => {
    const action = vi.fn()
    expect(requireSignIn('hunt', action, 'Join Old City Walk')).toBe(false)
    expect(action).not.toHaveBeenCalled()
    expect(useSignInPrompt.getState()).toMatchObject({ reason: 'hunt', context: 'Join Old City Walk' })
  })

  it('runs the held action exactly once when the sign-in lands, then closes', () => {
    const action = vi.fn()
    requireSignIn('save', action)
    act(() => useAuth.setState({ user: USER }))
    expect(action).toHaveBeenCalledTimes(1)
    expect(useSignInPrompt.getState().reason).toBeNull()
    act(() => useAuth.setState({ user: { ...USER, email: 'changed@example.test' } }))
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('a later prompt replaces an earlier one — only the last tap is replayed', () => {
    const first = vi.fn()
    const second = vi.fn()
    requireSignIn('save', first)
    requireSignIn('vote', second)
    act(() => useAuth.setState({ user: USER }))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalled()
  })

  it('a prompt with no action just closes on sign-in (gesture-only things)', () => {
    requireSignIn('alerts')
    act(() => useAuth.setState({ user: USER }))
    expect(useSignInPrompt.getState().reason).toBeNull()
  })

  it('a sign-in with no prompt open touches nothing', () => {
    act(() => useAuth.setState({ user: USER }))
    expect(useSignInPrompt.getState().reason).toBeNull()
  })
})

describe('useIsGuest', () => {
  it('is false while the stored session restores, so no "sign in" flashes', () => {
    useAuth.setState({ status: 'idle' })
    expect(renderHook(() => useIsGuest()).result.current).toBe(false)
  })
  it('is true once restored with nobody signed in', () => {
    expect(renderHook(() => useIsGuest()).result.current).toBe(true)
  })
  it('is false signed in, and when auth is off', () => {
    useAuth.setState({ user: USER })
    expect(renderHook(() => useIsGuest()).result.current).toBe(false)
    useAuth.setState({ user: null })
    mocks.available = false
    expect(renderHook(() => useIsGuest()).result.current).toBe(false)
  })
})

describe('next= for the sign-in page', () => {
  it('round-trips an in-app route', () => {
    expect(signInPath('/you?tab=1')).toBe('/signin?next=%2Fyou%3Ftab%3D1')
    expect(safeNext('/spot/bayshore-boulevard')).toBe('/spot/bayshore-boulevard')
  })
  it('refuses anything that is not an in-app route', () => {
    expect(safeNext(null)).toBe('/')
    expect(safeNext('https://evil.example')).toBe('/')
    expect(safeNext('//evil.example')).toBe('/')
    expect(safeNext('javascript:alert(1)')).toBe('/')
  })
})

describe('return-to (Google redirect round trip)', () => {
  it('stashes a hash route and hands it back once', () => {
    rememberReturn('#/spot/bayshore-boulevard', 1000)
    expect(takeReturn(2000)).toBe('#/spot/bayshore-boulevard')
    expect(takeReturn(3000)).toBeNull()
  })

  it('ignores anything but a hash route', () => {
    rememberReturn('', 1000)
    rememberReturn('https://evil.example', 1000)
    expect(takeReturn(2000)).toBeNull()
  })

  it('drops a stash older than ten minutes — an abandoned attempt', () => {
    rememberReturn('#/you', 0)
    expect(takeReturn(10 * 60 * 1000 + 1)).toBeNull()
  })

  it('survives garbage in storage', () => {
    sessionStorage.setItem('vantage.return-to', '{nope')
    expect(takeReturn()).toBeNull()
    sessionStorage.setItem('vantage.return-to', JSON.stringify({ hash: 5, at: 'x' }))
    expect(takeReturn()).toBeNull()
  })

  it('back from the redirect: restores the route and tells the router', () => {
    rememberReturn('#/day?date=2026-10-03&stops=golden:bayshore-boulevard')
    window.history.replaceState(null, '', '/?code=abc123')
    const popped = vi.fn()
    window.addEventListener('popstate', popped)
    restoreReturn()
    window.removeEventListener('popstate', popped)
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('#/day?date=2026-10-03&stops=golden:bayshore-boulevard')
    expect(popped).toHaveBeenCalled()
  })

  it('back from the redirect with nothing stashed: just tidies ?code=', () => {
    window.history.replaceState(null, '', '/?code=abc123#/you')
    restoreReturn()
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('#/you')
  })

  it('any other sign-in leaves the URL alone and drops a leftover stash', () => {
    rememberReturn('#/spot/old')
    window.history.replaceState(null, '', '/#/community')
    restoreReturn()
    expect(window.location.hash).toBe('#/community')
    expect(takeReturn()).toBeNull()
  })
})
