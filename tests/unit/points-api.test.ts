import { describe, it, expect, vi } from 'vitest'

/* Points now live server-side (B11): point_events is written only by
   validated RPCs, and the client just reads its own ledger. */

let rows: unknown[] | null = []
let failSelect = false
const from = vi.fn(() => ({
  select: vi.fn(() => ({
    order: async () => (failSelect ? { data: null, error: { message: 'boom' } } : { data: rows, error: null }),
  })),
}))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  getSupabase: async () => ({ from }),
}))

import { fetchMyPointEvents } from '../../src/craft/points-api'
import { pointsTotal } from '../../src/craft/points'

describe('fetchMyPointEvents', () => {
  it('maps ledger rows to PointEvents, newest last (chronological)', async () => {
    rows = [
      { id: 'a', reason: 'huntStop', pts: 25, created_at: '2026-07-15T01:00:00Z' },
      { id: 'b', reason: 'huntFinish', pts: 100, created_at: '2026-07-15T02:00:00Z' },
    ]
    const events = await fetchMyPointEvents()
    expect(events).toHaveLength(2)
    expect(events[0]).toEqual({ id: 'a', reason: 'huntStop', pts: 25, at: '2026-07-15T01:00:00Z' })
    expect(pointsTotal(events)).toBe(125)
  })

  it('returns an empty ledger on error instead of throwing', async () => {
    failSelect = true
    expect(await fetchMyPointEvents()).toEqual([])
    failSelect = false
  })
})
