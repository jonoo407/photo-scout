import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/* The orchestration around mergeState.

   `sync-merge.ts` — the pure reconciliation — is covered exhaustively in
   auth-sync.test.ts. What is covered here is the engine that CALLS it: pull the
   account row, merge, apply, push back, then debounce-push on change and let go
   cleanly on sign-out. Every failure in this file is silent data loss across a
   user's devices, which is why it is worth testing without a real Supabase. */

const upsert = vi.fn(async (_row: { user_id: string; data: unknown; updated_at: string }) => ({ error: null }))
const maybeSingle = vi.fn(async () => ({ data: null as { data?: unknown } | null, error: null as unknown }))
const from = vi.fn(() => ({
  upsert,
  select: () => ({ eq: () => ({ maybeSingle }) }),
}))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ from, auth: {} })),
}))

import { pullAndMerge, startSync, stopSync } from '../../src/auth/sync'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

const USER = '11111111-2222-4333-8444-555555555555'

const remoteRow = (over: Record<string, unknown> = {}) => ({
  data: {
    wishlist: ['boathouse-row'],
    visited: ['independence-hall'],
    checklist: { 'race-street-pier': ['bridge-up'] },
    spotNotes: { 'boathouse-row': 'remote note' },
    savedPlans: [],
    home: DEFAULT_HOME,
    region: 'philadelphia',
    units: 'metric',
    mapsApp: 'google',
    theme: 'dark',
    ...over,
  },
})

const resetStore = () => {
  useStore.setState({
    wishlist: [], visited: [], checklist: {}, spotNotes: {}, savedPlans: [],
    home: DEFAULT_HOME, region: 'tampa-bay', units: 'imperial', mapsApp: 'apple', theme: 'auto',
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  maybeSingle.mockResolvedValue({ data: null, error: null })
  resetStore()
})
afterEach(() => { stopSync() })

describe('pullAndMerge', () => {
  it('merges the account row into this device and applies it', async () => {
    useStore.setState({ wishlist: ['bayshore-boulevard'], units: 'imperial' })
    maybeSingle.mockResolvedValue({ data: remoteRow(), error: null })

    await pullAndMerge(USER)

    const s = useStore.getState()
    expect(s.wishlist).toEqual(['bayshore-boulevard', 'boathouse-row']) // union, nothing lost
    expect(s.units).toBe('metric')   // remote scalars win
    expect(s.region).toBe('philadelphia')
  })

  it('pushes the merged result straight back, so the account gains this device\'s spots', async () => {
    useStore.setState({ wishlist: ['bayshore-boulevard'] })
    maybeSingle.mockResolvedValue({ data: remoteRow(), error: null })

    await pullAndMerge(USER)

    expect(upsert).toHaveBeenCalledTimes(1)
    const written = upsert.mock.calls[0][0] as { user_id: string; data: { wishlist: string[] }; updated_at: string }
    expect(written.user_id).toBe(USER)
    expect(written.data.wishlist).toEqual(['bayshore-boulevard', 'boathouse-row'])
    expect(Date.parse(written.updated_at)).not.toBeNaN()
  })

  it('applies the merged theme to the document', async () => {
    maybeSingle.mockResolvedValue({ data: remoteRow({ theme: 'dark' }), error: null })
    await pullAndMerge(USER)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('first sign-in with no account row keeps local state and seeds the account', async () => {
    useStore.setState({ wishlist: ['bayshore-boulevard'], visited: ['fort-de-soto-park'] })
    maybeSingle.mockResolvedValue({ data: null, error: null })

    await pullAndMerge(USER)

    expect(useStore.getState().wishlist).toEqual(['bayshore-boulevard'])
    expect((upsert.mock.calls[0][0].data as { visited: string[] }).visited)
      .toEqual(['fort-de-soto-park'])
  })

  it('leaves local state completely alone when the read fails', async () => {
    // Offline, or the table is missing. Overwriting local state from a failed
    // read is how a user loses everything they saved on this device.
    useStore.setState({ wishlist: ['bayshore-boulevard'], units: 'imperial' })
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'network' } })

    await pullAndMerge(USER)

    expect(useStore.getState().wishlist).toEqual(['bayshore-boulevard'])
    expect(useStore.getState().units).toBe('imperial')
    expect(upsert).not.toHaveBeenCalled() // and nothing is pushed on a failed read
  })

  it('tolerates a row whose data column is empty', async () => {
    useStore.setState({ wishlist: ['bayshore-boulevard'] })
    maybeSingle.mockResolvedValue({ data: { data: null }, error: null })
    await pullAndMerge(USER)
    expect(useStore.getState().wishlist).toEqual(['bayshore-boulevard'])
  })
})

describe('startSync / stopSync', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('debounces — a burst of edits produces one push, not one per keystroke', async () => {
    startSync(USER)
    for (const note of ['s', 'sh', 'sho', 'shoot']) {
      useStore.setState({ spotNotes: { 'bayshore-boulevard': note } })
    }
    expect(upsert).not.toHaveBeenCalled() // nothing yet — still inside the window

    await vi.advanceTimersByTimeAsync(2500)
    expect(upsert).toHaveBeenCalledTimes(1)
    expect((upsert.mock.calls[0][0].data as { spotNotes: Record<string, string> }).spotNotes)
      .toEqual({ 'bayshore-boulevard': 'shoot' })
  })

  it('pushes again for a change made after the window closes', async () => {
    startSync(USER)
    useStore.setState({ wishlist: ['a'] })
    await vi.advanceTimersByTimeAsync(2500)
    useStore.setState({ wishlist: ['a', 'b'] })
    await vi.advanceTimersByTimeAsync(2500)
    expect(upsert).toHaveBeenCalledTimes(2)
  })

  it('stops pushing after sign-out, including a change already in flight', async () => {
    startSync(USER)
    useStore.setState({ wishlist: ['a'] })
    stopSync() // sign-out lands inside the debounce window

    await vi.advanceTimersByTimeAsync(5000)
    expect(upsert).not.toHaveBeenCalled()

    // And the store subscription is gone — a signed-out user's edits stay local.
    useStore.setState({ wishlist: ['a', 'b'] })
    await vi.advanceTimersByTimeAsync(5000)
    expect(upsert).not.toHaveBeenCalled()
  })

  it('is safe to stop when never started, and to start twice', async () => {
    expect(() => stopSync()).not.toThrow()
    startSync(USER)
    startSync(USER) // re-sign-in must not leave two live subscriptions
    useStore.setState({ wishlist: ['a'] })
    await vi.advanceTimersByTimeAsync(2500)
    expect(upsert).toHaveBeenCalledTimes(1)
  })
})
