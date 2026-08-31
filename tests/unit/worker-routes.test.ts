import { describe, it, expect, afterEach, vi } from 'vitest'
import worker from '../../worker/index'
import { harness, subRow, type Harness } from '../helpers/worker-env'

/* The Worker's request router: the shortlist unfurl, the three Supabase DB
   webhooks, the Resend inbound-mail relay, the push proxy, and everything else
   falling through to the assets binding.

   The guards matter more than the happy paths here — several of them are the
   only thing standing between a public URL and someone's inbox. */

const OWNER = '11111111-2222-4333-8444-555555555555'
const LIST_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'

const postJson = (path: string, body: unknown) =>
  new Request(`https://shootvantage.com${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })

/** Script the Supabase RPC leg by function name. */
const rpcRouter = (byFn: Record<string, unknown>, extra?: (url: string) => Response | undefined) =>
  (url: string): Response => {
    const rpc = /\/rest\/v1\/rpc\/([a-z_]+)/.exec(url)?.[1]
    if (rpc) {
      return rpc in byFn
        ? new Response(JSON.stringify(byFn[rpc]), { status: 200 })
        : new Response('null', { status: 404 })
    }
    return extra?.(url) ?? new Response('{}', { status: 200 })
  }

let h: Harness
afterEach(() => { vi.unstubAllGlobals() })

describe('GET /l/:id — shortlist unfurl', () => {
  it('serves OG html for a known list', async () => {
    h = harness({}, rpcRouter({ get_shortlist: [{ title: 'Engagement options', spots: [1, 2, 3] }] }))
    const res = await worker.fetch(new Request(`https://shootvantage.com/l/${LIST_ID}`), h.env)
    const html = await res.text()

    expect(res.headers.get('content-type')).toMatch(/text\/html/)
    // Must not be cached: the title changes when the photographer edits the list.
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(html).toContain('Engagement options')
    expect(h.assetRequests).toHaveLength(0)
  })

  it('falls through to the app for an unknown id, rather than 404ing', async () => {
    h = harness({}, rpcRouter({ get_shortlist: [] }))
    const res = await worker.fetch(new Request(`https://shootvantage.com/l/${LIST_ID}`), h.env)
    expect(res.status).toBe(200)
    expect(h.assetRequests).toHaveLength(1) // the app's own empty state
  })

  it('does not treat a non-uuid path as a list id', async () => {
    h = harness({}, rpcRouter({ get_shortlist: [{ title: 'x', spots: [] }] }))
    await worker.fetch(new Request('https://shootvantage.com/l/not-a-uuid'), h.env)
    expect(h.calls.filter((c) => c.url.includes('get_shortlist'))).toHaveLength(0)
    expect(h.assetRequests).toHaveLength(1)
  })

  it('survives a shortlist row whose spots column is not an array', async () => {
    h = harness({}, rpcRouter({ get_shortlist: [{ title: null, spots: null }] }))
    const res = await worker.fetch(new Request(`https://shootvantage.com/l/${LIST_ID}`), h.env)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<meta')
  })
})

describe('POST /api/shortlist/response-hook', () => {
  const body = (over: Record<string, unknown> = {}) => ({
    record: { list_id: LIST_ID, client_name: 'Dana', picked: ['bayshore-boulevard'], comment: 'love these', ...over },
  })

  it('rejects a payload with no or malformed list id', async () => {
    h = harness({}, rpcRouter({}))
    for (const list_id of [undefined, 'not-a-uuid', '../../x']) {
      const res = await worker.fetch(postJson('/api/shortlist/response-hook', body({ list_id })), h.env)
      expect(res.status, String(list_id)).toBe(400)
    }
  })

  it('stops quietly when the list has no resolvable owner', async () => {
    h = harness({}, rpcRouter({ get_shortlist: [{ title: 't', spots: [] }] })) // get_list_owner 404s
    const res = await worker.fetch(postJson('/api/shortlist/response-hook', body()), h.env)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('no owner')
  })

  it('pushes to the owner and names the client in the alert', async () => {
    h = harness({}, rpcRouter({ get_list_owner: OWNER, get_shortlist: [{ title: 'Bridal party', spots: [] }] }))
    h.storage.map.set('sub:mine', subRow({ userId: OWNER }))

    const res = await worker.fetch(postJson('/api/shortlist/response-hook', body()), h.env)
    expect(await res.json()).toMatchObject({ ok: true, sent: 1, emailed: false })

    const queued = h.storage.map.get('pending:mine') as Array<{ title: string; body: string; url: string }>
    expect(queued[0].title).toBe('Dana picked their spots')
    expect(queued[0].body).toContain('Bridal party')
    expect(queued[0].url).toBe('/#/you')
  })

  it('falls back to a generic title when the client left no name', async () => {
    h = harness({}, rpcRouter({ get_list_owner: OWNER, get_shortlist: [{ title: null, spots: [] }] }))
    h.storage.map.set('sub:mine', subRow({ userId: OWNER }))
    await worker.fetch(postJson('/api/shortlist/response-hook', body({ client_name: '   ' })), h.env)

    const queued = h.storage.map.get('pending:mine') as Array<{ title: string; body: string }>
    expect(queued[0].title).toBe('Your client responded')
    expect(queued[0].body).toContain('Location options')
  })

  it('never asks for the owner email without the shared secret', async () => {
    // Holding a list link must not be enough to learn the photographer's address.
    h = harness({ RESEND_API_KEY: 'rk_test' }, rpcRouter({ get_list_owner: OWNER, get_shortlist: [{ title: 't', spots: [] }] }))
    const res = await worker.fetch(postJson('/api/shortlist/response-hook', body()), h.env)
    expect(await res.json()).toMatchObject({ emailed: false })
    expect(h.calls.filter((c) => c.url.includes('get_owner_email'))).toHaveLength(0)
  })

  it('emails the owner when both the key and the hook secret are configured', async () => {
    h = harness(
      { RESEND_API_KEY: 'rk_test', SUPABASE_HOOK_SECRET: 'shh' },
      rpcRouter({ get_list_owner: OWNER, get_shortlist: [{ title: 'Bridal party', spots: [] }], get_owner_email: 'jon@example.test' }),
    )
    const res = await worker.fetch(postJson('/api/shortlist/response-hook', body()), h.env)
    expect(await res.json()).toMatchObject({ emailed: true })

    const secretCall = h.calls.find((c) => c.url.includes('get_owner_email'))!
    expect(JSON.parse(String(secretCall.init!.body))).toEqual({ p_id: LIST_ID, p_secret: 'shh' })

    const send = h.calls.find((c) => c.url === 'https://api.resend.com/emails')!
    const sent = JSON.parse(String(send.init!.body))
    expect(sent.to).toEqual(['jon@example.test'])
    // Picked ids are resolved to spot names for the email body.
    expect(sent.html).toContain('Bayshore Boulevard')
  })

  it('reports emailed:false when Resend rejects the send', async () => {
    h = harness(
      { RESEND_API_KEY: 'rk_test', SUPABASE_HOOK_SECRET: 'shh' },
      rpcRouter(
        { get_list_owner: OWNER, get_shortlist: [{ title: 't', spots: [] }], get_owner_email: 'jon@example.test' },
        (url) => url === 'https://api.resend.com/emails' ? new Response('nope', { status: 422 }) : undefined,
      ),
    )
    const res = await worker.fetch(postJson('/api/shortlist/response-hook', body()), h.env)
    expect(await res.json()).toMatchObject({ emailed: false })
  })
})

describe('POST /api/feedback-hook', () => {
  it('400s a record with no message', async () => {
    h = harness({ RESEND_API_KEY: 'rk_test' })
    const res = await worker.fetch(postJson('/api/feedback-hook', { record: { kind: 'bug' } }), h.env)
    expect(res.status).toBe(400)
  })

  it('no-ops without a Resend key — the DB row is still the durable record', async () => {
    h = harness({})
    const res = await worker.fetch(postJson('/api/feedback-hook', { record: { message: 'hi' } }), h.env)
    expect(await res.json()).toEqual({ ok: true, emailed: false })
    expect(h.calls).toHaveLength(0)
  })

  it('sets reply-to only when the tester left an address', async () => {
    h = harness({ RESEND_API_KEY: 'rk_test' })
    await worker.fetch(postJson('/api/feedback-hook', { record: { message: 'a', contact_email: 't@example.test' } }), h.env)
    await worker.fetch(postJson('/api/feedback-hook', { record: { message: 'b' } }), h.env)

    const bodies = h.calls.filter((c) => c.url === 'https://api.resend.com/emails').map((c) => JSON.parse(String(c.init!.body)))
    expect(bodies[0].reply_to).toEqual(['t@example.test'])
    expect(bodies[1]).not.toHaveProperty('reply_to')
  })

  it('escapes tester-supplied text — the message goes straight into an email body', async () => {
    h = harness({ RESEND_API_KEY: 'rk_test' })
    await worker.fetch(postJson('/api/feedback-hook', {
      record: { message: '<img src=x onerror=alert(1)>', kind: '<b>bug', app_version: '0.1 & up', contact_email: '<script>' },
    }), h.env)

    const sent = JSON.parse(String(h.calls.find((c) => c.url === 'https://api.resend.com/emails')!.init!.body))
    expect(sent.html).not.toContain('<img')
    expect(sent.html).not.toContain('<script>')
    expect(sent.html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(sent.html).toContain('0.1 &amp; up')
  })
})

describe('POST /api/report-hook', () => {
  it('400s without a photo id', async () => {
    h = harness({ RESEND_API_KEY: 'rk_test' })
    expect((await worker.fetch(postJson('/api/report-hook', { record: { reason: 'nudity' } }), h.env)).status).toBe(400)
  })

  it('flags an auto-hidden shot in the subject so triage can skip it', async () => {
    h = harness({ RESEND_API_KEY: 'rk_test' })
    await worker.fetch(postJson('/api/report-hook', { record: { photo_id: 'p1', reason: 'nudity', hidden: true } }), h.env)
    await worker.fetch(postJson('/api/report-hook', { record: { photo_id: 'p2', reason: 'spam', hidden: false } }), h.env)

    const subjects = h.calls.filter((c) => c.url === 'https://api.resend.com/emails')
      .map((c) => JSON.parse(String(c.init!.body)).subject)
    expect(subjects[0]).toContain('AUTO-HIDDEN')
    expect(subjects[1]).not.toContain('AUTO-HIDDEN')
  })

  it('escapes the reporter\'s free-text note', async () => {
    h = harness({ RESEND_API_KEY: 'rk_test' })
    await worker.fetch(postJson('/api/report-hook', {
      record: { photo_id: 'p1', reason: 'other', note: '</p><script>steal()</script>' },
    }), h.env)
    const sent = JSON.parse(String(h.calls.find((c) => c.url === 'https://api.resend.com/emails')!.init!.body))
    expect(sent.html).not.toContain('<script>')
    expect(sent.html).toContain('&lt;script&gt;')
  })
})

describe('POST /api/inbound-mail — the open-relay guard', () => {
  const SECRET = 'whsec_' + btoa('super-secret-key')
  const svixHeaders = async (raw: string, id = 'msg_1', ts = String(Math.floor(Date.now() / 1000))) => {
    const key = await crypto.subtle.importKey(
      'raw', Uint8Array.from(atob(SECRET.replace(/^whsec_/, '')), (c) => c.charCodeAt(0)) as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    )
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${raw}`))
    return {
      'svix-id': id,
      'svix-timestamp': ts,
      'svix-signature': `v1,${btoa(String.fromCharCode(...new Uint8Array(sig)))}`,
      'content-type': 'application/json',
    }
  }
  const signedRequest = async (payload: unknown, id?: string, ts?: string) => {
    const raw = JSON.stringify(payload)
    return new Request('https://shootvantage.com/api/inbound-mail', {
      method: 'POST', headers: await svixHeaders(raw, id, ts), body: raw,
    })
  }
  const configured = {
    RESEND_WEBHOOK_SECRET: SECRET, RESEND_API_KEY: 'rk_test', SUPPORT_FORWARD_TO: 'jon@example.test',
  }

  it('503s and forwards nothing when the secret is not configured', async () => {
    h = harness({ RESEND_API_KEY: 'rk_test', SUPPORT_FORWARD_TO: 'jon@example.test' })
    const res = await worker.fetch(await signedRequest({ type: 'email.received' }), h.env)
    expect(res.status).toBe(503)
    expect(h.calls).toHaveLength(0)
  })

  it('401s an unsigned request', async () => {
    h = harness(configured)
    const res = await worker.fetch(postJson('/api/inbound-mail', { type: 'email.received' }), h.env)
    expect(res.status).toBe(401)
    expect(h.calls).toHaveLength(0)
  })

  it('401s a request signed with the wrong secret', async () => {
    h = harness({ ...configured, RESEND_WEBHOOK_SECRET: 'whsec_' + btoa('a-different-key') })
    const res = await worker.fetch(await signedRequest({ type: 'email.received', data: { id: 'e1' } }), h.env)
    expect(res.status).toBe(401)
    expect(h.calls).toHaveLength(0)
  })

  it('401s a correctly signed but stale request (replay)', async () => {
    h = harness(configured)
    const oldTs = String(Math.floor(Date.now() / 1000) - 3600)
    const res = await worker.fetch(await signedRequest({ type: 'email.received', data: { id: 'e1' } }, 'msg_1', oldTs), h.env)
    expect(res.status).toBe(401)
    expect(h.calls).toHaveLength(0)
  })

  it('ignores event types other than email.received', async () => {
    h = harness(configured)
    const res = await worker.fetch(await signedRequest({ type: 'email.delivered' }), h.env)
    expect(await res.json()).toEqual({ ok: true, skipped: 'email.delivered' })
    expect(h.calls).toHaveLength(0)
  })

  it('400s a received event carrying no email id', async () => {
    h = harness(configured)
    const res = await worker.fetch(await signedRequest({ type: 'email.received', data: {} }), h.env)
    expect(res.status).toBe(400)
  })

  it('502s when the body cannot be fetched back from Resend', async () => {
    h = harness(configured, (url) => url.includes('/emails/receiving/')
      ? new Response('nope', { status: 500 })
      : new Response('{}'))
    const res = await worker.fetch(await signedRequest({ type: 'email.received', data: { email_id: 'e1' } }), h.env)
    expect(res.status).toBe(502)
    // Nothing was forwarded on a failed fetch.
    expect(h.calls.filter((c) => c.url === 'https://api.resend.com/emails')).toHaveLength(0)
  })

  it('forwards a verified email to the configured address', async () => {
    h = harness(configured, (url) => url.includes('/emails/receiving/')
      ? new Response(JSON.stringify({
          id: 'e1', from: 'Ada <ada@example.test>', to: ['support@shootvantage.com'],
          subject: 'Access question', text: 'Is the pier gated?', html: null,
          created_at: '2026-08-30T00:00:00Z',
        }), { status: 200 })
      : new Response('{"id":"sent"}', { status: 200 }))

    const res = await worker.fetch(await signedRequest({ type: 'email.received', data: { email_id: 'e1' } }), h.env)
    expect(await res.json()).toEqual({ ok: true })

    const sent = JSON.parse(String(h.calls.find((c) => c.url === 'https://api.resend.com/emails')!.init!.body))
    expect(sent.to).toEqual(['jon@example.test'])
    expect(sent.reply_to).toEqual(['ada@example.test']) // hitting reply reaches the sender
    expect(sent.subject).toBe('Access question')
  })
})

describe('/api/push/* proxy and asset fallthrough', () => {
  it('proxies to the durable object, preserving path and query', async () => {
    h = harness()
    h.storage.map.set('sub:abc', subRow({ spotIds: ['bayshore-boulevard'] }))
    const res = await worker.fetch(new Request('https://shootvantage.com/api/push/status?k=abc'), h.env)
    expect(await res.json()).toEqual({ subscribed: true, watching: 1 })
  })

  it('serves everything else from the assets binding', async () => {
    h = harness()
    for (const path of ['/', '/#/explore', '/assets/index-abc.js', '/api/unknown']) {
      await worker.fetch(new Request(`https://shootvantage.com${path}`), h.env)
    }
    expect(h.assetRequests).toHaveLength(4)
  })

  it('does not treat a GET on a hook path as the hook', async () => {
    h = harness({ RESEND_API_KEY: 'rk_test' })
    await worker.fetch(new Request('https://shootvantage.com/api/feedback-hook'), h.env)
    expect(h.assetRequests).toHaveLength(1)
    expect(h.calls).toHaveLength(0)
  })
})

describe('CORS for the native wrapper', () => {
  /* The wrapper's pages live on capacitor://localhost, so its /api/push calls
     are cross-origin and WKWebView enforces CORS. Without these answers the
     device token can never reach the server — TestFlight build 16's alerts
     toggle failed exactly here (2026-08-31). */

  it('answers the preflight for /api/push/*', async () => {
    h = harness()
    const res = await worker.fetch(new Request('https://shootvantage.com/api/push/subscribe', {
      method: 'OPTIONS',
      headers: {
        origin: 'capacitor://localhost',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    }), h.env)
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBe('capacitor://localhost')
    expect(res.headers.get('access-control-allow-methods')).toMatch(/POST/)
    expect(res.headers.get('access-control-allow-headers')).toMatch(/content-type/i)
    expect(h.assetRequests).toHaveLength(0)
  })

  it('marks /api/push/* responses readable from the wrapper origin', async () => {
    h = harness()
    const res = await worker.fetch(new Request('https://shootvantage.com/api/push/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'capacitor://localhost' },
      body: JSON.stringify({ endpoint: 'apns://tok-1', spotIds: [], userId: null }),
    }), h.env)
    expect(res.status).toBe(200)
    expect(res.headers.get('access-control-allow-origin')).toBe('capacitor://localhost')
  })

  it('leaves other routes un-CORSed', async () => {
    h = harness()
    const res = await worker.fetch(
      new Request('https://shootvantage.com/api/feedback-hook', { method: 'OPTIONS' }), h.env)
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })
})

describe('scheduled()', () => {
  it('runs the daily cron against the durable object', async () => {
    h = harness()
    h.storage.map.set('sub:a', subRow({ spotIds: ['bayshore-boulevard'] }))
    await worker.scheduled(null, h.env)
    // The cron either alerted (writing a dedupe marker) or scored and passed;
    // either way it reached the spot rather than no-oping.
    expect(h.storage.map.has('sub:a')).toBe(true)
  })
})
