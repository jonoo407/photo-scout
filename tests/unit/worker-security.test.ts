import { describe, it, expect, afterEach, vi } from 'vitest'
import worker, { LIMITS } from '../../worker/index'
import { harness, subRow, jwtKit, withJwks, type Harness } from '../helpers/worker-env'

/* Each block replays an attack from the 2026-09-24 readiness audit against the
   real Worker and proves it no longer lands:
     1. /api/push/* forwarded ANY path to the Durable Object, so anyone could
        POST /api/push/notify-owner (push arbitrary text to any user's devices)
        or /api/push/cron (burn the forecast API on demand).
     2. /subscribe trusted a body `userId`, so an attacker could register their
        own device under a victim's id and read the victim's client-response
        notifications. The id is easy to get: get_list_owner() hands it to
        anyone holding a shortlist link.
     3. The three Supabase DB webhooks checked nothing, so anyone could drive
        push + email — and Resend's quota is shared with password-reset mail. */

const VICTIM = '11111111-2222-4333-8444-555555555555'
const ATTACKER = '22222222-3333-4444-8555-666666666666'
const LIST_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const SECRET = 'hook-secret-value'

const req = (path: string, init: RequestInit & { headers?: Record<string, string> } = {}) =>
  new Request(`https://shootvantage.com${path}`, init)

const postJson = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  req(path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })

const rpc = (byFn: Record<string, unknown>) => (url: string): Response => {
  const fn = /\/rest\/v1\/rpc\/([a-z_]+)/.exec(url)?.[1]
  if (fn) return fn in byFn ? new Response(JSON.stringify(byFn[fn])) : new Response('null', { status: 404 })
  return new Response('{}')
}

const resendCalls = (h: Harness) => h.calls.filter((c) => c.url === 'https://api.resend.com/emails')
const pushCalls = (h: Harness) => h.calls.filter((c) => c.url.startsWith('https://push.example.test/'))

let h: Harness
afterEach(() => { vi.unstubAllGlobals() })

describe('hole 1: internal Durable Object routes are not public', () => {
  it('POST /api/push/notify-owner cannot push arbitrary text to a user', async () => {
    h = harness()
    h.storage.map.set('sub:victim', subRow({ endpoint: 'https://push.example.test/victim', userId: VICTIM }))
    const res = await worker.fetch(postJson('/api/push/notify-owner', {
      ownerId: VICTIM, alert: { title: 'Your account is locked', body: 'Sign in at evil.test', url: 'https://evil.test' },
    }), h.env)
    expect(res.status).toBe(404)
    expect(pushCalls(h)).toHaveLength(0)
    expect(h.storage.map.has('pending:victim')).toBe(false)
  })

  it('POST /api/push/cron cannot run the daily job on demand', async () => {
    h = harness()
    h.storage.map.set('sub:a', subRow({ spotIds: ['bayshore-boulevard'] }))
    const res = await worker.fetch(postJson('/api/push/cron', {}), h.env)
    expect(res.status).toBe(404)
    expect(h.calls.filter((c) => c.url.includes('open-meteo'))).toHaveLength(0)
  })

  it('POST /api/push/ratelimit cannot reset or drain a bucket', async () => {
    h = harness()
    const res = await worker.fetch(postJson('/api/push/ratelimit', { bucket: 'email:day', limit: 1e9, windowMs: 1 }), h.env)
    expect(res.status).toBe(404)
    expect([...h.storage.map.keys()].some((k) => k.startsWith('rl:'))).toBe(false)
  })

  it('public routes answer only their own method', async () => {
    h = harness()
    for (const [method, path] of [['GET', '/subscribe'], ['POST', '/vapid'], ['POST', '/pending'], ['GET', '/unsubscribe'], ['GET', '/nope']]) {
      const res = await worker.fetch(req(`/api/push${path}`, { method }), h.env)
      expect(res.status, `${method} ${path}`).toBe(404)
    }
  })

  it('the allowlisted routes still work', async () => {
    h = harness()
    expect((await worker.fetch(req('/api/push/vapid'), h.env)).status).toBe(200)
    h.storage.map.set('sub:k', subRow())
    expect(await (await worker.fetch(req('/api/push/status?k=k'), h.env)).json()).toEqual({ subscribed: true, watching: 1 })
    expect((await worker.fetch(req('/api/push/pending?k=k'), h.env)).status).toBe(200)
  })
})

describe('hole 2: a device is bound only to the account in a verified token', () => {
  const subscribe = (token: string | null, body: Record<string, unknown>) =>
    postJson('/api/push/subscribe', body, token ? { authorization: `Bearer ${token}` } : {})
  const rows = (h: Harness) => [...h.storage.map.entries()].filter(([k]) => k.startsWith('sub:')).map(([, v]) => v as { userId: string })

  it('refuses a subscribe with no token, even one claiming a userId', async () => {
    const kit = await jwtKit()
    h = harness({}, withJwks(kit))
    const res = await worker.fetch(subscribe(null, { endpoint: 'https://push.example.test/evil', spotIds: [], userId: VICTIM }), h.env)
    expect(res.status).toBe(401)
    expect(rows(h)).toHaveLength(0)
  })

  it('binds to the token\'s user, ignoring a victim id in the body — and the victim\'s notifications never reach it', async () => {
    const kit = await jwtKit()
    h = harness({ SUPABASE_HOOK_SECRET: SECRET }, withJwks(kit, rpc({ get_list_owner: VICTIM, get_shortlist: [{ title: 'Wedding' }] })))
    const res = await worker.fetch(subscribe(await kit.sign(ATTACKER), {
      endpoint: 'https://push.example.test/evil', spotIds: [], userId: VICTIM,
    }), h.env)
    expect(res.status).toBe(200)
    expect(rows(h).map((r) => r.userId)).toEqual([ATTACKER])

    // A real client response on the victim's list now fires the hook.
    const hook = await worker.fetch(postJson('/api/shortlist/response-hook',
      { record: { list_id: LIST_ID, client_name: 'Dana' } }, { 'x-vantage-hook-secret': SECRET }), h.env)
    expect(await hook.json()).toMatchObject({ sent: 0 })
    expect(pushCalls(h)).toHaveLength(0)
  })

  it('rejects tokens that are forged, expired, for another project, or not a user session', async () => {
    const kit = await jwtKit()
    const imposter = await jwtKit() // same kid, different private key
    h = harness({}, withJwks(kit))
    const now = Math.floor(Date.now() / 1000)
    const hs256 = (await kit.sign(VICTIM, {}, { alg: 'HS256' }))
    const [hh, pp] = (await kit.sign(VICTIM)).split('.')
    const tampered = [hh, btoa(JSON.stringify({ sub: VICTIM, role: 'authenticated' })).replace(/=+$/, ''), 'sig'].join('.')
    const bad: Record<string, string> = {
      'wrong signing key': await imposter.sign(VICTIM),
      expired: await kit.sign(VICTIM, { exp: now - 120 }),
      'other issuer': await kit.sign(VICTIM, { iss: 'https://other.supabase.co/auth/v1' }),
      'anon role': await kit.sign(VICTIM, { role: 'anon' }),
      'wrong audience': await kit.sign(VICTIM, { aud: 'service' }),
      'not yet valid': await kit.sign(VICTIM, { nbf: now + 3600 }),
      'unknown kid': await kit.sign(VICTIM, {}, { kid: 'nope' }),
      'HS256 header': hs256,
      'alg none': `${btoa(JSON.stringify({ alg: 'none', kid: 'test-kid' })).replace(/=+$/, '')}.${pp}.`,
      'tampered payload': tampered,
      'non-uuid sub': await kit.sign('../../admin'),
      garbage: 'not-a-jwt',
    }
    for (const [label, token] of Object.entries(bad)) {
      const res = await worker.fetch(subscribe(token, { endpoint: 'https://push.example.test/x', spotIds: [] }), h.env)
      expect(res.status, label).toBe(401)
    }
    expect(rows(h)).toHaveLength(0)
  })

  it('rate-limits subscribe per user', async () => {
    const kit = await jwtKit()
    h = harness({}, withJwks(kit))
    const token = await kit.sign(ATTACKER)
    const statuses: number[] = []
    for (let i = 0; i <= LIMITS.subscribePerUser.limit; i++) {
      statuses.push((await worker.fetch(subscribe(token, { endpoint: `https://push.example.test/e${i}`, spotIds: [] }), h.env)).status)
    }
    expect(statuses.slice(0, -1).every((s) => s === 200)).toBe(true)
    expect(statuses.at(-1)).toBe(429)
  })

  it('rate-limits push writes per IP across accounts', async () => {
    const kit = await jwtKit()
    h = harness({}, withJwks(kit))
    h.storage.map.set('rl:ip:203.0.113.9', { start: Date.now(), count: LIMITS.pushWritesPerIp.limit, windowMs: 3600_000 })
    const res = await worker.fetch(postJson('/api/push/subscribe',
      { endpoint: 'https://push.example.test/x', spotIds: [] },
      { authorization: `Bearer ${await kit.sign(ATTACKER)}`, 'cf-connecting-ip': '203.0.113.9' }), h.env)
    expect(res.status).toBe(429)
    const un = await worker.fetch(postJson('/api/push/unsubscribe', { endpoint: 'https://push.example.test/x' },
      { 'cf-connecting-ip': '203.0.113.9' }), h.env)
    expect(un.status).toBe(429)
  })

  it('unsubscribe still works signed out — the endpoint is the capability', async () => {
    h = harness()
    const res = await worker.fetch(postJson('/api/push/unsubscribe', { endpoint: 'https://push.example.test/x' }), h.env)
    expect(res.status).toBe(200)
  })
})

describe('hole 3: the database webhooks require the shared secret', () => {
  const hooks = [
    ['/api/shortlist/response-hook', { record: { list_id: LIST_ID, client_name: 'Dana' } }],
    ['/api/feedback-hook', { record: { message: 'spam spam spam' } }],
    ['/api/report-hook', { record: { photo_id: 'p1', reason: 'spam' } }],
  ] as const
  const upstream = rpc({ get_list_owner: VICTIM, get_shortlist: [{ title: 't' }], get_owner_email: 'owner@example.test' })

  for (const [path, body] of hooks) {
    describe(path, () => {
      it('401s with no secret header, sending nothing', async () => {
        h = harness({ SUPABASE_HOOK_SECRET: SECRET, RESEND_API_KEY: 'rk' }, upstream)
        h.storage.map.set('sub:victim', subRow({ endpoint: 'https://push.example.test/victim', userId: VICTIM }))
        const res = await worker.fetch(postJson(path, body), h.env)
        expect(res.status).toBe(401)
        expect(h.calls).toHaveLength(0)
      })

      it('401s with the wrong secret', async () => {
        h = harness({ SUPABASE_HOOK_SECRET: SECRET, RESEND_API_KEY: 'rk' }, upstream)
        for (const guess of ['', 'x', SECRET.slice(0, -1), SECRET + 'x', SECRET.toUpperCase()]) {
          const res = await worker.fetch(postJson(path, body, { 'x-vantage-hook-secret': guess }), h.env)
          expect(res.status, JSON.stringify(guess)).toBe(401)
        }
        expect(h.calls).toHaveLength(0)
      })

      it('fails closed (503) when the Worker has no secret configured', async () => {
        h = harness({ RESEND_API_KEY: 'rk' }, upstream)
        const res = await worker.fetch(postJson(path, body, { 'x-vantage-hook-secret': 'anything' }), h.env)
        expect(res.status).toBe(503)
        expect(h.calls).toHaveLength(0)
      })

      it('runs with the right secret', async () => {
        h = harness({ SUPABASE_HOOK_SECRET: SECRET, RESEND_API_KEY: 'rk' }, upstream)
        const res = await worker.fetch(postJson(path, body, { 'x-vantage-hook-secret': SECRET }), h.env)
        expect(res.status).toBe(200)
        expect(await res.json()).toMatchObject({ emailed: true })
      })
    })
  }
})

describe('email and notification budgets', () => {
  const withSecret = (path: string, body: unknown) => postJson(path, body, { 'x-vantage-hook-secret': SECRET })

  it('caps feedback emails per hour; the rows are still the durable record', async () => {
    h = harness({ SUPABASE_HOOK_SECRET: SECRET, RESEND_API_KEY: 'rk' })
    const out: boolean[] = []
    for (let i = 0; i < LIMITS.feedbackEmails.limit + 3; i++) {
      const res = await worker.fetch(withSecret('/api/feedback-hook', { record: { message: `m${i}` } }), h.env)
      out.push(((await res.json()) as { emailed: boolean }).emailed)
    }
    expect(resendCalls(h)).toHaveLength(LIMITS.feedbackEmails.limit)
    expect(out.slice(-3)).toEqual([false, false, false])
  })

  it('caps report emails per hour', async () => {
    h = harness({ SUPABASE_HOOK_SECRET: SECRET, RESEND_API_KEY: 'rk' })
    for (let i = 0; i < LIMITS.reportEmails.limit + 2; i++) {
      await worker.fetch(withSecret('/api/report-hook', { record: { photo_id: `p${i}`, reason: 'spam' } }), h.env)
    }
    expect(resendCalls(h)).toHaveLength(LIMITS.reportEmails.limit)
  })

  it('shares one daily ceiling across all hooks, leaving quota for auth mail', async () => {
    h = harness({ SUPABASE_HOOK_SECRET: SECRET, RESEND_API_KEY: 'rk' })
    h.storage.map.set('rl:email:day', { start: Date.now(), count: LIMITS.hookEmailsPerDay.limit - 1, windowMs: 86400_000 })
    await worker.fetch(withSecret('/api/feedback-hook', { record: { message: 'a' } }), h.env)
    await worker.fetch(withSecret('/api/report-hook', { record: { photo_id: 'p', reason: 'spam' } }), h.env)
    expect(resendCalls(h)).toHaveLength(1)
  })

  it('caps client-response pushes and emails per owner', async () => {
    h = harness({ SUPABASE_HOOK_SECRET: SECRET, RESEND_API_KEY: 'rk' },
      rpc({ get_list_owner: VICTIM, get_shortlist: [{ title: 't' }], get_owner_email: 'owner@example.test' }))
    h.storage.map.set('sub:victim', subRow({ endpoint: 'https://push.example.test/victim', userId: VICTIM }))
    h.storage.map.set(`rl:notify:${VICTIM}`, { start: Date.now(), count: LIMITS.notifyPerOwner.limit, windowMs: 3600_000 })
    const res = await worker.fetch(withSecret('/api/shortlist/response-hook', { record: { list_id: LIST_ID } }), h.env)
    expect(await res.json()).toMatchObject({ sent: 0, emailed: false, limited: true })
    expect(pushCalls(h)).toHaveLength(0)
    expect(resendCalls(h)).toHaveLength(0)
  })
})
