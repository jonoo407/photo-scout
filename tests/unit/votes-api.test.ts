import { describe, it, expect, vi, beforeEach } from 'vitest'

/* The next-city scoreboard. Every function here returns null/false rather than
   throwing, because the Community screen has to render offline — so what needs
   proving is that each failure shape actually reaches that fallback, and that
   "unreachable" never renders as a confident zero. */

const rpc = vi.fn()
const maybeSingle = vi.fn()
const upsert = vi.fn()
const getUser = vi.fn()

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({
    rpc,
    from: () => ({ select: () => ({ maybeSingle }), upsert }),
    auth: { getUser },
  })),
}))

import { fetchVoteTotals, fetchMyVote, castVote } from '../../src/community/votes-api'

const USER = { id: '11111111-2222-4333-8444-555555555555' }

beforeEach(() => {
  vi.clearAllMocks()
  getUser.mockResolvedValue({ data: { user: USER } })
})

describe('fetchVoteTotals', () => {
  it('reduces the definer function\'s rows into a city → count map', async () => {
    rpc.mockResolvedValue({ data: [{ city: 'nyc', votes: 12 }, { city: 'sf', votes: 3 }], error: null })
    expect(await fetchVoteTotals()).toEqual({ nyc: 12, sf: 3 })
    expect(rpc).toHaveBeenCalledWith('city_vote_totals')
  })

  it('coerces counts that arrive as strings (postgres bigint over PostgREST)', async () => {
    rpc.mockResolvedValue({ data: [{ city: 'nyc', votes: '12' }], error: null })
    expect(await fetchVoteTotals()).toEqual({ nyc: 12 })
  })

  it('returns null — not {} — when the tallies are unreachable', async () => {
    // The UI distinguishes these: null says "unavailable", {} would render as
    // a real scoreboard on which every city has zero votes.
    rpc.mockResolvedValue({ data: null, error: { message: 'offline' } })
    expect(await fetchVoteTotals()).toBeNull()

    rpc.mockResolvedValue({ data: null, error: null })
    expect(await fetchVoteTotals()).toBeNull()

    rpc.mockRejectedValue(new Error('function does not exist'))
    expect(await fetchVoteTotals()).toBeNull()
  })

  it('returns an empty map when nobody has voted yet', async () => {
    rpc.mockResolvedValue({ data: [], error: null })
    expect(await fetchVoteTotals()).toEqual({})
  })
})

describe('fetchMyVote', () => {
  it('returns the signed-in user\'s city', async () => {
    maybeSingle.mockResolvedValue({ data: { city: 'nyc' }, error: null })
    expect(await fetchMyVote()).toBe('nyc')
  })

  it('returns null when the user has not voted', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await fetchMyVote()).toBeNull()
  })

  it('returns null on an RLS refusal or a thrown client', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    expect(await fetchMyVote()).toBeNull()

    maybeSingle.mockRejectedValue(new Error('boom'))
    expect(await fetchMyVote()).toBeNull()
  })
})

describe('castVote', () => {
  it('upserts on the user id so a second vote replaces the first', async () => {
    upsert.mockResolvedValue({ error: null })
    expect(await castVote('nyc')).toBe(true)
    expect(upsert).toHaveBeenCalledWith({ user_id: USER.id, city: 'nyc' })
  })

  it('refuses when nobody is signed in — one vote per account', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    expect(await castVote('nyc')).toBe(false)
    expect(upsert).not.toHaveBeenCalled()
  })

  it('reports failure rather than throwing when the write is rejected', async () => {
    upsert.mockResolvedValue({ error: { message: 'rls' } })
    expect(await castVote('nyc')).toBe(false)

    upsert.mockRejectedValue(new Error('network'))
    expect(await castVote('nyc')).toBe(false)
  })
})
