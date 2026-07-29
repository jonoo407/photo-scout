import { describe, it, expect, beforeEach, vi } from 'vitest'

/* Photo reporting + blocking (V1, App Review guideline 1.2). Both ride
   definer RPCs: the client never learns a photo owner's uuid, so blocking
   is keyed off the photo, and the auto-hide decision is made server-side
   where the report count can't be forged. */

let rpcResult: { data: unknown; error: { message: string } | null } = { data: null, error: null }
const rpc = vi.fn(async (_fn: string, _args: unknown) => rpcResult)

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  getSupabase: async () => ({ rpc }),
}))

import {
  reportPhoto, blockPhotoOwner, fetchBlockedCount, unblockEveryone, REPORT_REASONS,
} from '../../src/spots/photo-reports-api'

beforeEach(() => {
  rpc.mockClear()
  rpcResult = { data: null, error: null }
})

describe('REPORT_REASONS', () => {
  it('covers the objectionable-content cases guideline 1.2 is about', () => {
    const ids = REPORT_REASONS.map((r) => r.id)
    expect(ids).toEqual(['offensive', 'harassment', 'copyright', 'spam', 'other'])
  })

  it('gives every reason a human label for the picker', () => {
    for (const r of REPORT_REASONS) expect(r.label.length).toBeGreaterThan(0)
  })
})

describe('reportPhoto', () => {
  it('calls the validating RPC and reports back whether the shot got hidden', async () => {
    rpcResult = { data: { hidden: true, reports: 2 }, error: null }
    const res = await reportPhoto('p1', 'offensive', 'explicit')
    expect(rpc).toHaveBeenCalledWith('report_photo', {
      p_photo_id: 'p1', p_reason: 'offensive', p_note: 'explicit',
    })
    expect(res).toEqual({ ok: true, hidden: true })
  })

  it('sends a null note when the reporter left it blank', async () => {
    rpcResult = { data: { hidden: false, reports: 1 }, error: null }
    await reportPhoto('p1', 'spam', '   ')
    expect(rpc).toHaveBeenCalledWith('report_photo', {
      p_photo_id: 'p1', p_reason: 'spam', p_note: null,
    })
  })

  it('surfaces the guard message on rejection', async () => {
    rpcResult = { data: null, error: { message: 'sign in to report' } }
    expect(await reportPhoto('p1', 'spam')).toEqual({ ok: false, message: 'sign in to report' })
  })

  it('does not throw when the network is gone', async () => {
    rpc.mockImplementationOnce(async () => { throw new Error('offline') })
    const res = await reportPhoto('p1', 'spam')
    expect(res.ok).toBe(false)
  })
})

describe('blockPhotoOwner', () => {
  it('blocks by photo id — the client never has the owner uuid', async () => {
    rpcResult = { data: { blocked: true }, error: null }
    const res = await blockPhotoOwner('p1')
    expect(rpc).toHaveBeenCalledWith('block_photo_owner', { p_photo_id: 'p1' })
    expect(res).toEqual({ ok: true })
  })

  it('surfaces the guard message when you block yourself', async () => {
    rpcResult = { data: null, error: { message: 'you cannot block yourself' } }
    expect(await blockPhotoOwner('p1')).toEqual({ ok: false, message: 'you cannot block yourself' })
  })
})

describe('fetchBlockedCount', () => {
  it('reads how many people you have blocked', async () => {
    rpcResult = { data: 3, error: null }
    expect(await fetchBlockedCount()).toBe(3)
    expect(rpc).toHaveBeenCalledWith('blocked_count', {})
  })

  it('reports zero rather than failing when signed out', async () => {
    rpcResult = { data: null, error: { message: 'nope' } }
    expect(await fetchBlockedCount()).toBe(0)
  })
})

describe('unblockEveryone', () => {
  it('clears the block list', async () => {
    rpcResult = { data: null, error: null }
    expect(await unblockEveryone()).toBe(true)
    expect(rpc).toHaveBeenCalledWith('unblock_everyone', {})
  })

  it('returns false when the call fails', async () => {
    rpcResult = { data: null, error: { message: 'boom' } }
    expect(await unblockEveryone()).toBe(false)
  })
})
