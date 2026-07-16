import { describe, it, expect, vi } from 'vitest'

/* listAllMyPhotos powers You's shots count + the /you/shots gallery: one
   owner-scoped query (RLS), newest first, public URLs resolved per path. */

let rows: unknown[] = []
const inserted: Array<Record<string, unknown>> = []
const from = vi.fn(() => ({
  select: vi.fn(() => ({ order: async () => ({ data: rows, error: null }) })),
  insert: vi.fn(async (row: Record<string, unknown>) => { inserted.push(row); return { error: null } }),
}))
const getPublicUrl = vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }))
const upload = vi.fn(async () => ({ error: null }))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  getSupabase: async () => ({
    from,
    storage: { from: () => ({ getPublicUrl, upload }) },
    auth: { getUser: async () => ({ data: { user: { id: 'u-1' } }, error: null }) },
  }),
}))

import { listAllMyPhotos, uploadSpotPhoto } from '../../src/spots/photos-api'

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

describe('uploadSpotPhoto', () => {
  it('returns the storage path so hunts can reference the proof shot', async () => {
    const path = await uploadSpotPhoto('bayshore-boulevard', new File(['x'], 'shot.jpg', { type: 'image/jpeg' }))
    expect(path).toMatch(/^u-1\/bayshore-boulevard\/\d+-shot\.jpg$/)
    expect(inserted[0]).toMatchObject({ owner: 'u-1', spot_id: 'bayshore-boulevard', path })
  })
})
