import { describe, it, expect, beforeEach, vi } from 'vitest'
import { deleteAccountWith, wipeLocalData, type DeleteAccountDeps } from '../../src/auth/delete-account'
import { useStore } from '../../src/state/store'
import { SEEN_KEY, hasSignedInBefore } from '../../src/auth/seen'
import { DEFAULT_HOME } from '../../src/data/home.config'

vi.mock('../../src/pwa/native', () => ({ isNativeApp: () => false }))

/* The device half of account deletion. The server deletes; this side must
   never wipe the local copy before the server has confirmed (a failed attempt
   should lose nothing), must stop sync first (a debounced push landing
   mid-deletion would write the account's data straight back), and must drop
   the session without asking a server that no longer knows the user. */

function deps(over: Partial<DeleteAccountDeps> = {}) {
  const order: string[] = []
  const d: DeleteAccountDeps = {
    accessToken: vi.fn(async () => 'tok'),
    post: vi.fn(async () => { order.push('post'); return { ok: true, status: 200 } }),
    stopSync: vi.fn(() => { order.push('stopSync') }),
    resumeSync: vi.fn(() => { order.push('resumeSync') }),
    turnOffAlerts: vi.fn(async () => { order.push('turnOffAlerts') }),
    wipeLocal: vi.fn(() => { order.push('wipeLocal') }),
    signOutLocal: vi.fn(async () => { order.push('signOutLocal') }),
    ...over,
  }
  return { d, order }
}

describe('deleteAccountWith', () => {
  it('stops sync, deletes server-side, then turns off alerts, wipes and signs out', async () => {
    const { d, order } = deps()
    expect(await deleteAccountWith(d)).toEqual({ ok: true })
    expect(order).toEqual(['stopSync', 'post', 'turnOffAlerts', 'wipeLocal', 'signOutLocal'])
  })

  it('sends the session token to the Worker route', async () => {
    const { d } = deps()
    await deleteAccountWith(d)
    expect(d.post).toHaveBeenCalledWith('/api/account/delete', 'tok')
  })

  it('does nothing at all without a session token', async () => {
    const { d, order } = deps({ accessToken: vi.fn(async () => null) })
    const res = await deleteAccountWith(d)
    expect(res.ok).toBe(false)
    expect(order).toEqual([])
  })

  it('keeps everything local and resumes sync when the server refuses', async () => {
    const { d, order } = deps({ post: vi.fn(async () => ({ ok: false, status: 502 })) })
    const res = await deleteAccountWith(d)
    expect(res).toEqual({ ok: false, message: expect.stringMatching(/nothing was lost/i) })
    expect(order).toEqual(['stopSync', 'resumeSync'])
    expect(d.wipeLocal).not.toHaveBeenCalled()
    expect(d.signOutLocal).not.toHaveBeenCalled()
  })

  it('treats a network failure like a refusal', async () => {
    const { d } = deps({ post: vi.fn(async () => { throw new TypeError('offline') }) })
    expect((await deleteAccountWith(d)).ok).toBe(false)
    expect(d.resumeSync).toHaveBeenCalled()
    expect(d.wipeLocal).not.toHaveBeenCalled()
  })

  it('tells the person to sign in again when the session was rejected', async () => {
    const { d } = deps({ post: vi.fn(async () => ({ ok: false, status: 401 })) })
    const res = await deleteAccountWith(d)
    expect(res).toEqual({ ok: false, message: expect.stringMatching(/sign back in/i) })
  })

  it('still wipes and signs out when turning alerts off fails — the server already forgot the devices', async () => {
    const { d } = deps({ turnOffAlerts: vi.fn(async () => { throw new Error('no sw') }) })
    expect(await deleteAccountWith(d)).toEqual({ ok: true })
    expect(d.wipeLocal).toHaveBeenCalled()
    expect(d.signOutLocal).toHaveBeenCalled()
  })
})

describe('wipeLocalData', () => {
  beforeEach(() => { localStorage.clear() })

  it('resets saved spots, plans, notes and home to a fresh install', () => {
    useStore.setState({
      wishlist: ['bayshore-boulevard'],
      visited: ['elfreths-alley'],
      spotNotes: { 'bayshore-boulevard': 'gate code 1234' },
      savedPlans: [{ id: 'p', name: 'Sat', date: '2026-09-26', stops: [], createdAt: '2026-09-24' }],
      home: { label: 'Current location', lat: 27.9, lng: -82.4 },
      theme: 'dark',
    })
    wipeLocalData()
    const s = useStore.getState()
    expect(s.wishlist).toEqual([])
    expect(s.visited).toEqual([])
    expect(s.spotNotes).toEqual({})
    expect(s.savedPlans).toEqual([])
    expect(s.home).toEqual(DEFAULT_HOME)
    expect(s.theme).toBe('auto')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    // Actions survive the reset — the app keeps working signed out.
    expect(typeof s.toggleWishlist).toBe('function')
  })

  it('forgets that this device ever signed in, so the next screen offers "create"', () => {
    localStorage.setItem(SEEN_KEY, '1')
    wipeLocalData()
    expect(hasSignedInBefore()).toBe(false)
  })
})
