import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TodayScreen from '../../src/ui/Today/TodayScreen'
import { useStore, EMPTY_FILTERS } from '../../src/state/store'
import { useAuth } from '../../src/auth/useAuth'
import { DEFAULT_HOME } from '../../src/data/home.config'

/* A failed sign-in link must be VISIBLE (incident 2026-07-16: the old flow
   failed silently and the user just looked signed out). Email links land on
   Today, so Today carries the banner. */

beforeEach(() => {
  useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay', units: 'imperial', wishlist: [], filters: EMPTY_FILTERS })
  useAuth.setState({ user: null, status: 'ready', errorMsg: null, linkError: null })
  global.fetch = vi.fn(async () => { throw new Error('offline') }) as unknown as typeof fetch
})
afterEach(() => { vi.restoreAllMocks() })

describe('Today — sign-in link error banner', () => {
  it('shows the failure with a path to retry', () => {
    useAuth.setState({ linkError: 'That sign-in link has expired or already been used — request a fresh one.' })
    render(<MemoryRouter><TodayScreen /></MemoryRouter>)
    expect(screen.getByText('Sign-in link problem')).toBeInTheDocument()
    expect(screen.getByText(/expired or already been used/i)).toBeInTheDocument()
  })

  it('stays out of the way otherwise', () => {
    render(<MemoryRouter><TodayScreen /></MemoryRouter>)
    expect(screen.queryByText('Sign-in link problem')).not.toBeInTheDocument()
  })
})
