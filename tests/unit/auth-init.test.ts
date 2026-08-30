import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/* initAuth: the bootstrap that ties a Supabase session to the auth store and
   the sync engine. Untested, this is where "signed in but nothing syncs" and
   "signed out but still pushing" live. */

// vi.mock factories are hoisted above the file, so the spies they close over
// have to be hoisted with them.
const { startSync, stopSync, pullAndMerge } = vi.hoisted(() => ({
  startSync: vi.fn(),
  stopSync: vi.fn(),
  pullAndMerge: vi.fn(async () => {}),
}))
vi.mock('../../src/auth/sync', () => ({ startSync, stopSync, pullAndMerge }))

const mocks = vi.hoisted(() => ({
  authAvailableValue: true,
  register: null as null | ((cb: (event: string, session: unknown) => void) => void),
  verifyOtp: vi.fn(async () => ({ data: { session: { user: { id: 'u1' } } }, error: null as unknown })),
  signOut: vi.fn(async () => ({ error: null })),
}))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => mocks.authAvailableValue,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({
    auth: {
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        mocks.register?.(cb)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
      verifyOtp: mocks.verifyOtp,
      signOut: mocks.signOut,
    },
  })),
}))

import { useAuth, initAuth } from '../../src/auth/useAuth'

const USER = { id: '11111111-2222-4333-8444-555555555555', email: 'jon@example.test' }

/** Capture the callback initAuth registers, so tests can drive it. */
let fire: (event: string, session: unknown) => void
beforeEach(() => {
  vi.clearAllMocks()
  mocks.authAvailableValue = true
  mocks.register = (cb) => { fire = cb }
  useAuth.setState({ user: null, status: 'idle', errorMsg: null, linkError: null })
  window.history.replaceState(null, '', '/')
})
afterEach(() => { vi.unstubAllGlobals() })

describe('initAuth', () => {
  it('is a no-op when auth is not configured', async () => {
    mocks.authAvailableValue = false
    await initAuth()
    expect(useAuth.getState().status).toBe('idle')
    expect(startSync).not.toHaveBeenCalled()
  })

  it('on sign-in: records the user, then merges and starts syncing', async () => {
    await initAuth()
    fire('SIGNED_IN', { user: USER })

    expect(useAuth.getState().user).toEqual({ id: USER.id, email: USER.email })
    expect(useAuth.getState().status).toBe('ready')

    expect(pullAndMerge).toHaveBeenCalledWith(USER.id)
    // Order matters: pushing store changes before the merge lands would
    // overwrite the account copy with this device's state.
    await vi.waitFor(() => expect(startSync).toHaveBeenCalledWith(USER.id))
    expect(pullAndMerge.mock.invocationCallOrder[0])
      .toBeLessThan(startSync.mock.invocationCallOrder[0])
  })

  it('tolerates a user row with no email', async () => {
    await initAuth()
    fire('SIGNED_IN', { user: { id: USER.id } })
    expect(useAuth.getState().user).toEqual({ id: USER.id, email: null })
  })

  it('on sign-out: clears the user and stops syncing', async () => {
    await initAuth()
    fire('SIGNED_IN', { user: USER })
    stopSync.mockClear()

    fire('SIGNED_OUT', null)
    expect(useAuth.getState().user).toBeNull()
    expect(useAuth.getState().status).toBe('ready')
    expect(stopSync).toHaveBeenCalled()
  })

  it('tidies the one-time ?code= off the URL after an OAuth redirect', async () => {
    window.history.replaceState(null, '', '/?code=abc123#/you')
    await initAuth()
    fire('SIGNED_IN', { user: USER })
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('#/you') // the route survives
  })

  it('surfaces an expired email link rather than failing silently', async () => {
    window.history.replaceState(null, '', '/?token_hash=deadbeef&type=email')
    mocks.verifyOtp.mockResolvedValueOnce({ data: { session: null as never }, error: { message: 'expired' } })

    await initAuth()

    expect(useAuth.getState().linkError).toMatch(/expired or already been used/)
  })

  it('leaves linkError alone on a successful email link', async () => {
    window.history.replaceState(null, '', '/?token_hash=goodtoken&type=email')
    await initAuth()
    expect(useAuth.getState().linkError).toBeNull()
  })
})

describe('signOut', () => {
  it('delegates to supabase — onAuthStateChange does the clearing', async () => {
    await useAuth.getState().signOut()
    expect(mocks.signOut).toHaveBeenCalled()
  })
})
