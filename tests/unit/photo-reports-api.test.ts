import { describe, it, expect, beforeEach, vi } from 'vitest'

/* Photo reporting + blocking (V1, App Review guideline 1.2). Both ride definer
   RPCs: the client never learns a photo owner's auth uuid, so blocking goes
   through an opaque per-photographer ref, and the auto-hide decision is made
   server-side where the report count can't be forged. */

let rpcResult: { data: unknown; error: { message: string } | null } = { data: null, error: null }
const rpc = vi.fn(async (_fn: string, _args: unknown) => rpcResult)

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  getSupabase: async () => ({ rpc }),
}))

import {
  reportPhoto, blockPhotographer, unblockPhotographer, fetchBlockedPhotographers,
  REPORT_REASONS,
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

describe('blockPhotographer', () => {
  it('blocks by opaque ref — never by an auth uuid, which the client never sees', async () => {
    rpcResult = { data: { blocked: true }, error: null }
    const res = await blockPhotographer('ref-abc')
    expect(rpc).toHaveBeenCalledWith('block_photographer', { p_ref: 'ref-abc' })
    expect(res).toEqual({ ok: true })
  })

  it('surfaces the guard message when you block yourself', async () => {
    rpcResult = { data: null, error: { message: 'you cannot block yourself' } }
    expect(await blockPhotographer('ref-abc')).toEqual({ ok: false, message: 'you cannot block yourself' })
  })
})

describe('unblockPhotographer', () => {
  it('lifts one block without touching the rest', async () => {
    rpcResult = { data: { unblocked: true }, error: null }
    expect(await unblockPhotographer('ref-abc')).toEqual({ ok: true })
    expect(rpc).toHaveBeenCalledWith('unblock_photographer', { p_ref: 'ref-abc' })
  })

  it('surfaces the guard message on failure', async () => {
    rpcResult = { data: null, error: { message: 'unknown photographer' } }
    expect(await unblockPhotographer('ref-abc')).toEqual({ ok: false, message: 'unknown photographer' })
  })
})

describe('fetchBlockedPhotographers', () => {
  it('lists who you blocked, so the list can be undone one at a time', async () => {
    rpcResult = {
      data: [
        { ref: 'ref-1', initials: 'SA', blocked_at: '2026-07-29T10:00:00Z' },
        { ref: 'ref-2', initials: 'LO', blocked_at: '2026-07-28T10:00:00Z' },
      ],
      error: null,
    }
    const list = await fetchBlockedPhotographers()
    expect(rpc).toHaveBeenCalledWith('blocked_photographers', {})
    expect(list).toEqual([
      { ref: 'ref-1', initials: 'SA', blockedAt: '2026-07-29T10:00:00Z' },
      { ref: 'ref-2', initials: 'LO', blockedAt: '2026-07-28T10:00:00Z' },
    ])
  })

  it('returns an empty list rather than failing when signed out', async () => {
    rpcResult = { data: null, error: { message: 'nope' } }
    expect(await fetchBlockedPhotographers()).toEqual([])
  })

  it('does not throw when the network is gone', async () => {
    rpc.mockImplementationOnce(async () => { throw new Error('offline') })
    expect(await fetchBlockedPhotographers()).toEqual([])
  })
})

