import { describe, it, expect, beforeEach, vi } from 'vitest'

/* Community shots API: listing rides the definer RPC (score-sorted, initials
   only); rating goes through rate_photo — the only thing that mints topShot
   points, server-side. */

let rpcResult: { data: unknown; error: { message: string } | null } = { data: [], error: null }
const rpc = vi.fn(async (_fn: string, _args: unknown) => rpcResult)
const getPublicUrl = vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  getSupabase: async () => ({ rpc, storage: { from: () => ({ getPublicUrl }) } }),
}))

import { fetchSpotCommunityPhotos, ratePhoto } from '../../src/spots/community-photos-api'

beforeEach(() => {
  rpc.mockClear()
  rpcResult = { data: [], error: null }
})

describe('fetchSpotCommunityPhotos', () => {
  it('maps RPC rows to photos with public urls', async () => {
    rpcResult = {
      data: [{
        id: 'p1', path: 'u1/bayshore-boulevard/a.jpg', owner_initials: 'SR',
        owner_ref: 'ref-sarah', is_mine: false,
        ratings_count: 3, avg_rating: 4.33, score: 3.813, my_rating: 5, created_at: '2026-07-16T00:00:00Z',
      }],
      error: null,
    }
    const photos = await fetchSpotCommunityPhotos('bayshore-boulevard')
    expect(rpc).toHaveBeenCalledWith('spot_community_photos', { p_spot_id: 'bayshore-boulevard' })
    expect(photos).toEqual([{
      id: 'p1', url: 'https://cdn.example/u1/bayshore-boulevard/a.jpg', ownerInitials: 'SR',
      ownerRef: 'ref-sarah',
      isMine: false, ratingsCount: 3, avgRating: 4.33, score: 3.813, myRating: 5,
    }])
  })

  it('tolerates a row from before refs existed rather than dropping the shot', async () => {
    rpcResult = {
      data: [{
        id: 'p1', path: 'a.jpg', owner_initials: '—', owner_ref: null, is_mine: false,
        ratings_count: 0, avg_rating: 0, score: 3.5, my_rating: null, created_at: '2026-07-16T00:00:00Z',
      }],
      error: null,
    }
    const [photo] = await fetchSpotCommunityPhotos('x')
    expect(photo.ownerRef).toBeNull()
  })

  it('returns empty on error', async () => {
    rpcResult = { data: null, error: { message: 'boom' } }
    expect(await fetchSpotCommunityPhotos('x')).toEqual([])
  })
})

describe('ratePhoto', () => {
  it('calls the validating RPC and returns the fresh stats', async () => {
    rpcResult = { data: { count: 3, avg: 4.33, awarded: true }, error: null }
    const res = await ratePhoto('p1', 5)
    expect(rpc).toHaveBeenCalledWith('rate_photo', { p_photo_id: 'p1', p_rating: 5 })
    expect(res).toEqual({ ok: true, count: 3, avg: 4.33 })
  })

  it('surfaces the guard message on rejection', async () => {
    rpcResult = { data: null, error: { message: 'you cannot rate your own shot' } }
    expect(await ratePhoto('p1', 5)).toEqual({ ok: false, message: 'you cannot rate your own shot' })
  })
})
