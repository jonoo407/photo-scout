import { describe, it, expect, vi } from 'vitest'

/* listAllMyPhotos powers You's shots count + the /you/shots gallery: one
   owner-scoped query (RLS), newest first, public URLs resolved per path. */

let rows: unknown[] = []
const from = vi.fn(() => ({
  select: vi.fn(() => ({ order: async () => ({ data: rows, error: null }) })),
}))
const getPublicUrl = vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  getSupabase: async () => ({
    from,
    storage: { from: () => ({ getPublicUrl }) },
  }),
}))

import { listAllMyPhotos } from '../../src/spots/photos-api'

describe('listAllMyPhotos', () => {
  it('maps rows to photos with spot ids and public urls', async () => {
    rows = [
      { id: 'p1', path: 'u1/bayshore-boulevard/a.jpg', spot_id: 'bayshore-boulevard', created_at: '2026-07-10T00:00:00Z' },
      { id: 'p2', path: 'u1/fort-de-soto-park/b.jpg', spot_id: 'fort-de-soto-park', created_at: '2026-07-09T00:00:00Z' },
    ]
    const photos = await listAllMyPhotos()
    expect(photos).toHaveLength(2)
    expect(photos[0]).toMatchObject({
      id: 'p1',
      spotId: 'bayshore-boulevard',
      url: 'https://cdn.example/u1/bayshore-boulevard/a.jpg',
    })
  })

  it('returns empty on error instead of throwing', async () => {
    rows = []
    const photos = await listAllMyPhotos()
    expect(photos).toEqual([])
  })
})
