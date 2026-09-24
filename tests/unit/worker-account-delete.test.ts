import { describe, it, expect, afterEach, vi } from 'vitest'
import worker from '../../worker/index'
import { harness, subRow, type Harness } from '../helpers/worker-env'

/* POST /api/account/delete — the Worker leg of in-app account deletion.

   Push registrations live in the AlertsDO, out of Supabase's reach, so the
   Worker forgets them and then hands the same token to the delete-account
   Edge Function. The guards matter most: only a session the auth server
   vouches for gets anywhere, only THAT user's devices go, and the private DO
   route behind it cannot be reached through the public /api/push/* proxy. */

const ME = '11111111-2222-4333-8444-555555555555'
const OTHER = '99999999-8888-4777-8666-555555555555'
const TOKEN = 'user.jwt.token'

const del = (headers: Record<string, string> = { authorization: `Bearer ${TOKEN}` }) =>
  new Request('https://shootvantage.com/api/account/delete', { method: 'POST', headers })

/** Script the auth server and the Edge Function. */
const supabase = (opts: { user?: unknown; userStatus?: number; fnStatus?: number; fnBody?: unknown } = {}) =>
  (url: string): Response => {
    if (url.endsWith('/auth/v1/user')) {
      return new Response(JSON.stringify(opts.user ?? { id: ME }), { status: opts.userStatus ?? 200 })
    }
    if (url.endsWith('/functions/v1/delete-account')) {
      return new Response(JSON.stringify(opts.fnBody ?? { ok: true, files: 2 }), { status: opts.fnStatus ?? 200 })
    }
    return new Response('{}', { status: 200 })
  }

const seedDevices = (h: Harness) => {
  h.storage.map.set('sub:mine-web', subRow({ endpoint: 'https://push.example.test/me', userId: ME }))
  h.storage.map.set('pending:mine-web', [{ title: 't', body: 'b', url: '/' }])
  h.storage.map.set('last:mine-web:bayshore-boulevard', '2026-09-20')
  h.storage.map.set('sub:mine-ios', subRow({ endpoint: 'apns://tok', userId: ME }))
  h.storage.map.set('sub:theirs', subRow({ endpoint: 'https://push.example.test/them', userId: OTHER }))
  h.storage.map.set('pending:theirs', [{ title: 't', body: 'b', url: '/' }])
  h.storage.map.set('sub:anon', subRow({ endpoint: 'https://push.example.test/anon', userId: null }))
}

let h: Harness
afterEach(() => { vi.unstubAllGlobals() })

describe('POST /api/account/delete', () => {
  it('401s with no bearer token, and calls nothing', async () => {
    h = harness({}, supabase())
    const variants: Array<Record<string, string>> = [{}, { authorization: 'Basic abc' }, { authorization: 'Bearer' }]
    for (const headers of variants) {
      const res = await worker.fetch(del(headers), h.env)
      expect(res.status).toBe(401)
    }
    expect(h.calls).toHaveLength(0)
  })

  it('401s when the auth server does not recognise the session', async () => {
    h = harness({}, supabase({ userStatus: 401, user: { message: 'invalid JWT' } }))
    seedDevices(h)
    const res = await worker.fetch(del(), h.env)
    expect(res.status).toBe(401)
    expect(h.storage.map.has('sub:mine-web')).toBe(true)
    expect(h.calls.some((c) => c.url.includes('/functions/v1/'))).toBe(false)
  })

  it('401s when the auth server answers without a usable user id', async () => {
    h = harness({}, supabase({ user: { id: 'not-a-uuid' } }))
    expect((await worker.fetch(del(), h.env)).status).toBe(401)
  })

  it('verifies the session with the caller\'s own token', async () => {
    h = harness({}, supabase())
    await worker.fetch(del(), h.env)
    const check = h.calls.find((c) => c.url.endsWith('/auth/v1/user'))!
    const headers = check.init!.headers as Record<string, string>
    expect(headers.Authorization).toBe(`Bearer ${TOKEN}`)
    expect(headers.apikey).toBe('anon-key')
  })

  it('forgets every device of this user — and only this user', async () => {
    h = harness({}, supabase())
    seedDevices(h)
    const res = await worker.fetch(del(), h.env)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, devices: 2 })

    expect(h.storage.map.has('sub:mine-web')).toBe(false)
    expect(h.storage.map.has('pending:mine-web')).toBe(false)
    expect(h.storage.map.has('last:mine-web:bayshore-boulevard')).toBe(false)
    expect(h.storage.map.has('sub:mine-ios')).toBe(false)

    expect(h.storage.map.has('sub:theirs')).toBe(true)
    expect(h.storage.map.has('pending:theirs')).toBe(true)
    expect(h.storage.map.has('sub:anon')).toBe(true)
  })

  it('hands the same token to the delete-account Edge Function', async () => {
    h = harness({}, supabase())
    await worker.fetch(del(), h.env)
    const fn = h.calls.find((c) => c.url === 'https://db.example.test/functions/v1/delete-account')!
    expect(fn.init!.method).toBe('POST')
    expect((fn.init!.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`)
  })

  it('reports failure when the Edge Function fails — never a false "deleted"', async () => {
    h = harness({}, supabase({ fnStatus: 500, fnBody: { error: 'could not delete the account', step: 'user' } }))
    seedDevices(h)
    const res = await worker.fetch(del(), h.env)
    expect(res.status).toBe(502)
    expect(await res.json()).toMatchObject({ step: 'user', devices: 2 })
  })

  it('passes a 401 from the Edge Function through as a 401', async () => {
    h = harness({}, supabase({ fnStatus: 401, fnBody: { error: 'sign in first' } }))
    expect((await worker.fetch(del(), h.env)).status).toBe(401)
  })

  it('502s when the Edge Function is unreachable', async () => {
    h = harness({}, (url) => {
      if (url.endsWith('/functions/v1/delete-account')) throw new TypeError('network down')
      return supabase()(url)
    })
    expect((await worker.fetch(del(), h.env)).status).toBe(502)
  })

  it('answers the native wrapper\'s preflight, allowing the Authorization header', async () => {
    h = harness()
    const res = await worker.fetch(new Request('https://shootvantage.com/api/account/delete', {
      method: 'OPTIONS',
      headers: { origin: 'capacitor://localhost', 'access-control-request-method': 'POST' },
    }), h.env)
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBe('capacitor://localhost')
    expect(res.headers.get('access-control-allow-headers')).toMatch(/authorization/i)
    expect(h.calls).toHaveLength(0)
  })

  it('marks the response readable from the wrapper origin', async () => {
    h = harness({}, supabase())
    const res = await worker.fetch(del(), h.env)
    expect(res.headers.get('access-control-allow-origin')).toBe('capacitor://localhost')
  })

  it('does not treat a GET as a delete', async () => {
    h = harness({}, supabase())
    await worker.fetch(new Request('https://shootvantage.com/api/account/delete', {
      headers: { authorization: `Bearer ${TOKEN}` },
    }), h.env)
    expect(h.calls).toHaveLength(0)
    expect(h.assetRequests).toHaveLength(1)
  })
})

describe('the private forget-user route', () => {
  it('cannot be reached through the public /api/push/* proxy', async () => {
    h = harness()
    seedDevices(h)
    for (const path of ['/api/push/forget-user', '/api/push/./forget-user', '/api/push/x/../forget-user']) {
      const res = await worker.fetch(new Request(`https://shootvantage.com${path}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: ME }),
      }), h.env)
      expect(res.status, path).toBe(404)
    }
    for (const path of ['/api/push//forget-user', '/api/push/%66orget-user']) {
      await worker.fetch(new Request(`https://shootvantage.com${path}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: ME }),
      }), h.env)
    }
    expect(h.storage.map.has('sub:mine-web')).toBe(true)
    expect(h.storage.map.has('sub:mine-ios')).toBe(true)
  })

  it('refuses a missing or malformed user id', async () => {
    h = harness()
    seedDevices(h)
    for (const body of [{}, { userId: '' }, { userId: 'x' }, null]) {
      const res = await h.DO.fetch(new Request('https://do/forget-user', {
        method: 'POST', body: JSON.stringify(body),
      }))
      expect(res.status).toBe(400)
    }
    expect(h.storage.map.size).toBe(7)
  })
})
