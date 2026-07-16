import { describe, it, expect, vi } from 'vitest'

/* listAllMyPhotos powers You's shots count + the /you/shots gallery: one
   owner-scoped query (RLS), newest first, public URLs resolved per path. */

let rows: unknown[] = []
let insertError: { message: string } | null = null
const inserted: Array<Record<string, unknown>> = []
const from = vi.fn(() => ({
  select: vi.fn(() => ({ order: async () => ({ data: rows, error: null }) })),
  insert: vi.fn(async (row: Record<string, unknown>) => {
    if (insertError) return { error: insertError }
    inserted.push(row)
    return { error: null }
  }),
}))
const getPublicUrl = vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }))
const upload = vi.fn(async () => ({ error: null }))
const remove = vi.fn(async (_paths: string[]) => ({ error: null }))
let storageLists: Record<string, Array<{ name: string; id: string | null }>> = {}
const list = vi.fn(async (prefix: string) => ({ data: storageLists[prefix] ?? [], error: null }))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  getSupabase: async () => ({
    from,
    storage: { from: () => ({ getPublicUrl, upload, remove, list }) },
    auth: { getUser: async () => ({ data: { user: { id: 'u-1' } }, error: null }) },
  }),
}))

import { listAllMyPhotos, uploadSpotPhoto, sweepMyOrphanPhotos } from '../../src/spots/photos-api'

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
    insertError = null
    const path = await uploadSpotPhoto('bayshore-boulevard', new File(['x'], 'shot.jpg', { type: 'image/jpeg' }))
    expect(path).toMatch(/^u-1\/bayshore-boulevard\/\d+-shot\.jpg$/)
    expect(inserted[0]).toMatchObject({ owner: 'u-1', spot_id: 'bayshore-boulevard', path })
  })

  it('removes the uploaded file when the tracking row fails — no orphans', async () => {
    insertError = { message: 'photo limit reached: 2 shots per spot at your craft level — earn points to raise it' }
    remove.mockClear()
    await expect(uploadSpotPhoto('bayshore-boulevard', new File(['x'], 'shot.jpg', { type: 'image/jpeg' })))
      .rejects.toThrow(/photo limit reached/)
    expect(remove).toHaveBeenCalledTimes(1)
    expect((remove.mock.calls[0][0] as string[])[0]).toMatch(/^u-1\/bayshore-boulevard\//)
    insertError = null
  })
})

describe('sweepMyOrphanPhotos', () => {
  it("removes files in the user's folder that have no tracking row", async () => {
    rows = [{ id: 'p1', path: 'u-1/bayshore-boulevard/keep.jpg', spot_id: 'bayshore-boulevard', created_at: '2026-07-16T00:00:00Z' }]
    storageLists = {
      'u-1': [{ name: 'bayshore-boulevard', id: null }, { name: 'tampa-riverwalk', id: null }],
      'u-1/bayshore-boulevard': [{ name: 'keep.jpg', id: 'f1' }, { name: 'orphan.jpg', id: 'f2' }],
      'u-1/tampa-riverwalk': [{ name: 'stray.jpg', id: 'f3' }],
    }
    remove.mockClear()
    const removed = await sweepMyOrphanPhotos()
    expect(removed).toBe(2)
    expect(remove).toHaveBeenCalledWith(['u-1/bayshore-boulevard/orphan.jpg', 'u-1/tampa-riverwalk/stray.jpg'])
  })

  it('touches nothing when everything is tracked', async () => {
    rows = [{ id: 'p1', path: 'u-1/bayshore-boulevard/keep.jpg', spot_id: 'bayshore-boulevard', created_at: '2026-07-16T00:00:00Z' }]
    storageLists = {
      'u-1': [{ name: 'bayshore-boulevard', id: null }],
      'u-1/bayshore-boulevard': [{ name: 'keep.jpg', id: 'f1' }],
    }
    remove.mockClear()
    expect(await sweepMyOrphanPhotos()).toBe(0)
    expect(remove).not.toHaveBeenCalled()
  })
})
