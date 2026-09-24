import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initWatchSync } from '../../src/push/watch-sync'
import { useStore } from '../../src/state/store'
import { useAuth } from '../../src/auth/useAuth'

const mocks = vi.hoisted(() => ({ syncWatchedSpots: vi.fn(async () => {}) }))
vi.mock('../../src/push/client', () => ({ syncWatchedSpots: mocks.syncWatchedSpots }))

beforeEach(() => {
  vi.clearAllMocks()
  useStore.setState({ wishlist: [], visited: [] })
  useAuth.setState({ user: null })
})

describe('watch-sync', () => {
  it('pushes wishlist changes to the server watch list', () => {
    const stop = initWatchSync()
    useStore.setState({ wishlist: ['fort-de-soto-park'] })
    expect(mocks.syncWatchedSpots).toHaveBeenCalledWith(['fort-de-soto-park'])
    stop()
  })

  it('ignores unrelated store changes', () => {
    const stop = initWatchSync()
    useStore.setState({ visited: ['x'] })
    expect(mocks.syncWatchedSpots).not.toHaveBeenCalled()
    stop()
  })

  it('re-registers under the new account when someone signs in', () => {
    // The Worker binds a device to the account in the access token, so a
    // device enabled before sign-in (or before the Worker verified tokens)
    // must re-register for client-response pushes to find it.
    useStore.setState({ wishlist: ['bayshore-boulevard'] })
    const stop = initWatchSync()
    useAuth.setState({ user: { id: 'u1', email: null } })
    expect(mocks.syncWatchedSpots).toHaveBeenCalledWith(['bayshore-boulevard'])
    mocks.syncWatchedSpots.mockClear()
    useAuth.setState({ status: 'ready' }) // same user, unrelated change
    useAuth.setState({ user: null }) // signed out: nothing to bind to
    expect(mocks.syncWatchedSpots).not.toHaveBeenCalled()
    stop()
  })
})
