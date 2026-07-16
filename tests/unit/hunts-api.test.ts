import { describe, it, expect, beforeEach, vi } from 'vitest'

/* hunts-api: definitions are public DB content; joins/progress are own-row
   reads; submissions go through the validating submit_hunt_stop RPC. */

let huntRows: unknown[] = []
let joinRows: unknown[] = []
let progressRows: unknown[] = []
let rpcResult: { data: unknown; error: { message: string } | null } = { data: null, error: null }
const upserted: Array<Record<string, unknown>> = []
const rpc = vi.fn(async (_fn: string, _args: unknown) => rpcResult)

const from = vi.fn((table: string) => ({
  select: vi.fn(() => {
    const rows = table === 'hunts' ? huntRows : table === 'hunt_joins' ? joinRows : progressRows
    const result = { data: rows, error: null }
    return {
      eq: () => ({ order: async () => result }),
      order: async () => result,
    }
  }),
  upsert: vi.fn(async (row: Record<string, unknown>) => { upserted.push({ table, ...row }); return { error: null } }),
}))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  getSupabase: async () => ({
    from,
    rpc,
    auth: { getUser: async () => ({ data: { user: { id: 'u-1' } }, error: null }) },
  }),
}))

import { fetchHunts, fetchMyHuntState, joinHunt, submitHuntStop } from '../../src/hunts/hunts-api'

beforeEach(() => {
  huntRows = []; joinRows = []; progressRows = []
  upserted.length = 0
  rpc.mockClear()
  rpcResult = { data: null, error: null }
})

describe('fetchHunts', () => {
  it('maps hunt rows, stops jsonb included', async () => {
    huntRows = [{
      id: 'golden-hour-grand-tour', region: 'tampa-bay', title: 'Golden Hour Grand Tour',
      blurb: 'Five stops.', stops: [{ spotId: 'bayshore-boulevard', name: 'Bayshore Boulevard', lat: 27.9, lng: -82.5, hint: 'x' }],
      stop_pts: 25, finish_pts: 100, opens_at: null, closes_at: null,
    }]
    const hunts = await fetchHunts('tampa-bay')
    expect(hunts).toHaveLength(1)
    expect(hunts[0].title).toBe('Golden Hour Grand Tour')
    expect(hunts[0].stopPts).toBe(25)
    expect(hunts[0].finishPts).toBe(100)
    expect(hunts[0].stops[0].spotId).toBe('bayshore-boulevard')
  })
})

describe('fetchMyHuntState', () => {
  it('returns joined hunt ids and progress rows', async () => {
    joinRows = [{ hunt_id: 'golden-hour-grand-tour' }]
    progressRows = [{ hunt_id: 'golden-hour-grand-tour', stop_index: 0, photo_path: 'u/a.jpg', created_at: '2026-07-15T00:00:00Z' }]
    const state = await fetchMyHuntState()
    expect(state.joins).toEqual(['golden-hour-grand-tour'])
    expect(state.progress[0]).toEqual({
      huntId: 'golden-hour-grand-tour', stopIndex: 0, photoPath: 'u/a.jpg', createdAt: '2026-07-15T00:00:00Z',
    })
  })
})

describe('joinHunt', () => {
  it('upserts the join for the signed-in user', async () => {
    expect(await joinHunt('golden-hour-grand-tour')).toBe(true)
    expect(upserted[0]).toMatchObject({ table: 'hunt_joins', owner: 'u-1', hunt_id: 'golden-hour-grand-tour' })
  })
})

describe('submitHuntStop', () => {
  it('calls the RPC with the exact params and returns the tally', async () => {
    rpcResult = { data: { done: 1, total: 5, finished: false, awarded: 25, totalPts: 25 }, error: null }
    const res = await submitHuntStop({
      huntId: 'golden-hour-grand-tour', stopIndex: 0, photoPath: 'u-1/bayshore-boulevard/a.jpg',
      lat: 27.9166, lng: -82.4826,
    })
    expect(rpc).toHaveBeenCalledWith('submit_hunt_stop', {
      p_hunt_id: 'golden-hour-grand-tour', p_stop_index: 0,
      p_photo_path: 'u-1/bayshore-boulevard/a.jpg', p_lat: 27.9166, p_lng: -82.4826,
    })
    expect(res).toEqual({ ok: true, done: 1, total: 5, finished: false, awarded: 25, totalPts: 25 })
  })

  it('surfaces the server guard message on rejection', async () => {
    rpcResult = { data: null, error: { message: 'too far from the stop (~210 m away)' } }
    const res = await submitHuntStop({ huntId: 'h', stopIndex: 0, photoPath: 'p', lat: 1, lng: 2 })
    expect(res).toEqual({ ok: false, message: 'too far from the stop (~210 m away)' })
  })
})
