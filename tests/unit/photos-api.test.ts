import { describe, it, expect, beforeEach, vi } from 'vitest'

const uploaded: Array<{ path: string; file: File }> = []
const removed: string[] = []
const inserted: Array<Record<string, unknown>> = []
let rows: unknown[] = []
let user: { id: string } | null = { id: 'user-1' }

const storageApi = {
  upload: vi.fn(async (path: string, file: File) => {
    uploaded.push({ path, file })
    return { data: { path }, error: null }
  }),
  remove: vi.fn(async (paths: string[]) => {
    removed.push(...paths)
    return { error: null }
  }),
  getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } })),
}

const deleteEq = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }))
const from = vi.fn(() => ({
  insert: vi.fn(async (row: Record<string, unknown>) => { inserted.push(row); return { error: null } }),
  select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(async () => ({ data: rows, error: null })) })) })),
  delete: vi.fn(deleteEq),
}))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  getSupabase: async () => ({
    from,
    storage: { from: vi.fn(() => storageApi) },
    auth: { getUser: async () => ({ data: { user }, error: null }) },
  }),
}))

import { uploadSpotPhoto, listMyPhotos, deleteSpotPhoto } from '../../src/spots/photos-api'

beforeEach(() => {
  uploaded.length = 0
  removed.length = 0
  inserted.length = 0
  rows = []
  user = { id: 'user-1' }
})

describe('photos-api', () => {
  it('uploads under the owner path and records the metadata row', async () => {
    const file = new File(['x'], 'shot.jpg', { type: 'image/jpeg' })
    await uploadSpotPhoto('bayshore-boulevard', file)
    expect(uploaded[0].path).toMatch(/^user-1\/bayshore-boulevard\/\d+-shot\.jpg$/)
    expect(inserted[0]).toMatchObject({ owner: 'user-1', spot_id: 'bayshore-boulevard' })
    expect(inserted[0].path).toBe(uploaded[0].path)
  })

  it('refuses signed-out uploads', async () => {
    user = null
    await expect(uploadSpotPhoto('x', new File(['x'], 'a.jpg'))).rejects.toThrow()
    expect(uploaded).toHaveLength(0)
  })

  it('lists my photos for a spot with public URLs', async () => {
    rows = [{ id: 'p1', path: 'user-1/bayshore-boulevard/1-a.jpg', created_at: '2026-07-06' }]
    const photos = await listMyPhotos('bayshore-boulevard')
    expect(photos).toEqual([
      { id: 'p1', path: 'user-1/bayshore-boulevard/1-a.jpg', url: 'https://cdn.test/user-1/bayshore-boulevard/1-a.jpg' },
    ])
  })

  it('deletes the file and the row', async () => {
    await deleteSpotPhoto('p1', 'user-1/bayshore-boulevard/1-a.jpg')
    expect(removed).toEqual(['user-1/bayshore-boulevard/1-a.jpg'])
  })
})
