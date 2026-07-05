import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStore } from '../../src/state/store'

/* Mock the supabase module: configured, no network. The chainable shapes below
   mirror exactly the postgrest calls shortlist-api makes. */
const inserted: Array<{ table: string; row: Record<string, unknown> }> = []
let myLists: unknown[] = []
let rpcRows: unknown[] = []
const deleteEq = vi.fn(async () => ({ error: null }))
const rpc = vi.fn(async () => ({ data: rpcRows, error: null }))

const from = vi.fn((table: string) => ({
  insert: vi.fn((row: Record<string, unknown>) => {
    inserted.push({ table, row })
    const result = Promise.resolve({ error: null })
    return Object.assign(result, {
      select: () => ({ single: async () => ({ data: { id: 'list-uuid-9' }, error: null }) }),
    })
  }),
  select: vi.fn(() => ({ order: async () => ({ data: myLists, error: null }) })),
  delete: vi.fn(() => ({ eq: deleteEq })),
}))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  getSupabase: async () => ({
    from,
    rpc,
    auth: { getUser: async () => ({ data: { user: { id: 'owner-1' } }, error: null }) },
  }),
}))

import {
  createShortlist, fetchSharedShortlist, submitShortlistResponse,
  fetchMyShortlists, deleteShortlist, refreshResponsesBadge,
} from '../../src/spots/shortlist-api'

beforeEach(() => {
  inserted.length = 0
  myLists = []
  rpcRows = []
  useStore.setState({ listsSeenAt: null, newClientResponse: false })
})

describe('createShortlist', () => {
  it('inserts the owner, title, and noted spots, returning the new list id', async () => {
    const id = await createShortlist('Smith family', [{ id: 'a', note: 'gorgeous backlight' }, { id: 'b' }])
    expect(id).toBe('list-uuid-9')
    expect(inserted[0].table).toBe('shortlists')
    expect(inserted[0].row).toMatchObject({
      owner: 'owner-1',
      title: 'Smith family',
      spots: [{ id: 'a', note: 'gorgeous backlight' }, { id: 'b' }],
    })
  })
})

describe('fetchSharedShortlist', () => {
  it('reads through the capability RPC and returns title + spots', async () => {
    rpcRows = [{ id: 'l1', title: 'Smith family', spots: [{ id: 'a', note: 'n' }], created_at: '2026-07-04T00:00:00Z' }]
    const list = await fetchSharedShortlist('l1')
    expect(rpc).toHaveBeenCalledWith('get_shortlist', { p_id: 'l1' })
    expect(list).toEqual({ title: 'Smith family', spots: [{ id: 'a', note: 'n' }] })
  })

  it('returns null for an unknown id', async () => {
    rpcRows = []
    expect(await fetchSharedShortlist('nope')).toBeNull()
  })
})

describe('submitShortlistResponse', () => {
  it('inserts the pick with optional name and comment', async () => {
    await submitShortlistResponse('l1', { picked: ['a', 'b'], clientName: 'Sarah', comment: 'Love the first one' })
    expect(inserted[0].table).toBe('shortlist_responses')
    expect(inserted[0].row).toEqual({
      list_id: 'l1', picked: ['a', 'b'], client_name: 'Sarah', comment: 'Love the first one',
    })
  })

  it('nulls out blank name/comment', async () => {
    await submitShortlistResponse('l1', { picked: ['a'] })
    expect(inserted[0].row).toMatchObject({ client_name: null, comment: null })
  })
})

describe('fetchMyShortlists', () => {
  it('maps embedded responses to camelCase', async () => {
    myLists = [{
      id: 'l1', title: 'Smith family', spots: [{ id: 'a' }], created_at: '2026-07-03T00:00:00Z',
      shortlist_responses: [{ id: 'r1', picked: ['a'], client_name: 'Sarah', comment: 'yes!', created_at: '2026-07-04T00:00:00Z' }],
    }]
    const lists = await fetchMyShortlists()
    expect(lists).toEqual([{
      id: 'l1', title: 'Smith family', spots: [{ id: 'a' }], createdAt: '2026-07-03T00:00:00Z',
      responses: [{ id: 'r1', picked: ['a'], clientName: 'Sarah', comment: 'yes!', createdAt: '2026-07-04T00:00:00Z' }],
    }])
  })
})

describe('deleteShortlist', () => {
  it('deletes by id', async () => {
    await deleteShortlist('l1')
    expect(deleteEq).toHaveBeenCalledWith('id', 'l1')
  })
})

describe('refreshResponsesBadge', () => {
  it('sets the store flag when a response is newer than last seen', async () => {
    myLists = [{
      id: 'l1', title: null, spots: [], created_at: '2026-07-01T00:00:00Z',
      shortlist_responses: [{ id: 'r1', picked: [], client_name: null, comment: null, created_at: '2026-07-04T00:00:00Z' }],
    }]
    useStore.setState({ listsSeenAt: '2026-07-02T00:00:00Z' })
    await refreshResponsesBadge()
    expect(useStore.getState().newClientResponse).toBe(true)
  })

  it('leaves the flag off when everything has been seen', async () => {
    myLists = [{
      id: 'l1', title: null, spots: [], created_at: '2026-07-01T00:00:00Z',
      shortlist_responses: [{ id: 'r1', picked: [], client_name: null, comment: null, created_at: '2026-07-01T12:00:00Z' }],
    }]
    useStore.setState({ listsSeenAt: '2026-07-02T00:00:00Z' })
    await refreshResponsesBadge()
    expect(useStore.getState().newClientResponse).toBe(false)
  })
})
