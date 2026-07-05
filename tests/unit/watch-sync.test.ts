import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initWatchSync } from '../../src/push/watch-sync'
import { useStore } from '../../src/state/store'

const mocks = vi.hoisted(() => ({ syncWatchedSpots: vi.fn(async () => {}) }))
vi.mock('../../src/push/client', () => ({ syncWatchedSpots: mocks.syncWatchedSpots }))

beforeEach(() => {
  vi.clearAllMocks()
  useStore.setState({ wishlist: [], visited: [] })
})

describe('watch-sync', () => {
  it('pushes wishlist changes to the server watch list', () => {
    const stop = initWatchSync()
    useStore.setState({ wishlist: ['fort-de-soto-park'] })
    expect(mocks.syncWatchedSpots).toHaveBeenCalledWith(['fort-de-soto-park'], null)
    stop()
  })

  it('ignores unrelated store changes', () => {
    const stop = initWatchSync()
    useStore.setState({ visited: ['x'] })
    expect(mocks.syncWatchedSpots).not.toHaveBeenCalled()
    stop()
  })
})
