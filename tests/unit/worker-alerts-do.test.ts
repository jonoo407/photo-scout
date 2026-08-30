import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { harness, subRow, type Harness } from '../helpers/worker-env'

/* The subscription store and the daily cron that drives conditions alerts.
   Its helpers (vapid, apns, alert-rules, best-days) are unit-tested on their
   own; what is covered here is the composition — which guard runs, what gets
   written, and what gets deleted. */

const post = (path: string, body: unknown) =>
  new Request(`https://do${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })

let h: Harness
beforeEach(() => { h = harness() })
afterEach(() => { vi.unstubAllGlobals() })

describe('AlertsDO /vapid', () => {
  it('generates a key pair on first ask and reuses it after', async () => {
    const first = await (await h.DO.fetch(new Request('https://do/vapid'))).json() as { publicKey: string }
    expect(first.publicKey).toBeTruthy()
    const second = await (await h.DO.fetch(new Request('https://do/vapid'))).json() as { publicKey: string }
    // Rotating the key would silently invalidate every existing subscription.
    expect(second.publicKey).toBe(first.publicKey)
  })
})

describe('AlertsDO /subscribe', () => {
  it('stores a web-push subscription under a hash of its endpoint', async () => {
    const res = await h.DO.fetch(post('/subscribe', {
      endpoint: 'https://push.example.test/ep-1', spotIds: ['bayshore-boulevard'],
    }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, watching: 1 })

    const keys = [...h.storage.map.keys()].filter((k) => k.startsWith('sub:'))
    expect(keys).toHaveLength(1)
    // The endpoint is a capability URL — the key must not be the endpoint itself.
    expect(keys[0]).not.toContain('push.example.test')
  })

  it('accepts a native apns:// endpoint too', async () => {
    const res = await h.DO.fetch(post('/subscribe', { endpoint: 'apns://devicetoken123', spotIds: [] }))
    expect(res.status).toBe(200)
  })

  it('rejects an endpoint that is neither https nor apns', async () => {
    for (const endpoint of ['http://insecure.test/x', 'javascript:alert(1)', 'ftp://x', '']) {
      const res = await h.DO.fetch(post('/subscribe', { endpoint }))
      expect(res.status, endpoint).toBe(400)
    }
    expect([...h.storage.map.keys()]).toHaveLength(0)
  })

  it('drops spot ids that are not real spots', async () => {
    const res = await h.DO.fetch(post('/subscribe', {
      endpoint: 'https://push.example.test/ep-1',
      spotIds: ['bayshore-boulevard', 'not-a-spot', '../../etc/passwd'],
    }))
    expect(await res.json()).toEqual({ ok: true, watching: 1 })
  })

  it('caps the watched list at MAX_WATCHED', async () => {
    const res = await h.DO.fetch(post('/subscribe', {
      endpoint: 'https://push.example.test/ep-1',
      spotIds: Array.from({ length: 40 }, () => 'bayshore-boulevard'),
    }))
    expect(await res.json()).toEqual({ ok: true, watching: 20 })
  })

  it('keeps a well-formed userId and discards anything that is not a uuid', async () => {
    const uuid = '11111111-2222-4333-8444-555555555555'
    await h.DO.fetch(post('/subscribe', { endpoint: 'https://push.example.test/a', spotIds: [], userId: uuid }))
    await h.DO.fetch(post('/subscribe', { endpoint: 'https://push.example.test/b', spotIds: [], userId: 'not-a-uuid' }))
    const rows = [...h.storage.map.entries()].filter(([k]) => k.startsWith('sub:')).map(([, v]) => v as { userId: string | null })
    expect(rows.map((r) => r.userId).sort()).toEqual([uuid, null])
  })
})

describe('AlertsDO /unsubscribe', () => {
  it('removes the subscription and its queued payloads', async () => {
    await h.DO.fetch(post('/subscribe', { endpoint: 'https://push.example.test/ep-1', spotIds: [] }))
    const key = [...h.storage.map.keys()].find((k) => k.startsWith('sub:'))!.slice('sub:'.length)
    h.storage.map.set(`pending:${key}`, [{ title: 'x', body: 'y', url: '/' }])

    const res = await h.DO.fetch(post('/unsubscribe', { endpoint: 'https://push.example.test/ep-1' }))
    expect(await res.json()).toEqual({ ok: true })
    expect([...h.storage.map.keys()].filter((k) => k.startsWith('sub:') || k.startsWith('pending:'))).toEqual([])
  })

  it('400s without an endpoint', async () => {
    expect((await h.DO.fetch(post('/unsubscribe', {}))).status).toBe(400)
  })
})

describe('AlertsDO /pending', () => {
  it('drains the queue — a payload is delivered exactly once', async () => {
    h.storage.map.set('pending:abc', [{ title: 'Tonight looks good', body: 'b', url: '/#/spot/x' }])
    const first = await (await h.DO.fetch(new Request('https://do/pending?k=abc'))).json() as unknown[]
    expect(first).toHaveLength(1)
    const second = await (await h.DO.fetch(new Request('https://do/pending?k=abc'))).json() as unknown[]
    expect(second).toEqual([])
  })

  it('400s with no key', async () => {
    expect((await h.DO.fetch(new Request('https://do/pending'))).status).toBe(400)
  })
})

describe('AlertsDO /status', () => {
  it('reports whether a key is subscribed and how much it watches', async () => {
    h.storage.map.set('sub:abc', subRow({ spotIds: ['bayshore-boulevard', 'curtis-hixon-waterfront-park'] }))
    expect(await (await h.DO.fetch(new Request('https://do/status?k=abc'))).json())
      .toEqual({ subscribed: true, watching: 2 })
    expect(await (await h.DO.fetch(new Request('https://do/status?k=nope'))).json())
      .toEqual({ subscribed: false, watching: 0 })
    expect(await (await h.DO.fetch(new Request('https://do/status'))).json())
      .toEqual({ subscribed: false, watching: 0 })
  })
})

describe('AlertsDO /notify-owner', () => {
  const alert = { title: 'Your client responded', body: 'b', url: '/#/you' }
  const owner = '11111111-2222-4333-8444-555555555555'

  it('pushes only to the owner\'s own devices', async () => {
    h.storage.map.set('sub:mine', subRow({ endpoint: 'https://push.example.test/mine', userId: owner }))
    h.storage.map.set('sub:theirs', subRow({ endpoint: 'https://push.example.test/theirs', userId: 'aaaaaaaa-2222-4333-8444-555555555555' }))
    h.storage.map.set('sub:anon', subRow({ endpoint: 'https://push.example.test/anon', userId: null }))

    const res = await h.DO.fetch(post('/notify-owner', { ownerId: owner, alert }))
    expect(await res.json()).toEqual({ ok: true, sent: 1 })

    const pushed = h.calls.filter((c) => c.url.startsWith('https://push.example.test/'))
    expect(pushed.map((c) => c.url)).toEqual(['https://push.example.test/mine'])
    // Only the owner's queue gets the payload — the tickle is contentless, so
    // a wrongly-queued payload is what would actually leak.
    expect(h.storage.map.has('pending:mine')).toBe(true)
    expect(h.storage.map.has('pending:theirs')).toBe(false)
  })

  it('400s on a payload with no owner or no title', async () => {
    expect((await h.DO.fetch(post('/notify-owner', { alert }))).status).toBe(400)
    expect((await h.DO.fetch(post('/notify-owner', { ownerId: owner, alert: {} }))).status).toBe(400)
  })

  it('drops a subscription the push service reports as gone', async () => {
    h = harness({}, (url) => url.includes('push.example.test')
      ? new Response('', { status: 410 })
      : new Response('{}'))
    h.storage.map.set('sub:mine', subRow({ userId: owner }))
    h.storage.map.set('pending:mine', [])

    const res = await h.DO.fetch(post('/notify-owner', { ownerId: owner, alert }))
    expect(await res.json()).toEqual({ ok: true, sent: 0 })
    expect(h.storage.map.has('sub:mine')).toBe(false)
    expect(h.storage.map.has('pending:mine')).toBe(false)
  })

  it('keeps the queue to the last five payloads', async () => {
    h.storage.map.set('sub:mine', subRow({ userId: owner }))
    for (let i = 0; i < 8; i++) {
      await h.DO.fetch(post('/notify-owner', { ownerId: owner, alert: { ...alert, body: `msg-${i}` } }))
    }
    const queued = h.storage.map.get('pending:mine') as Array<{ body: string }>
    expect(queued).toHaveLength(5)
    expect(queued.map((q) => q.body)).toEqual(['msg-3', 'msg-4', 'msg-5', 'msg-6', 'msg-7'])
  })
})

describe('AlertsDO native delivery', () => {
  const owner = '11111111-2222-4333-8444-555555555555'

  it('sends nothing at all when APNs is not configured — web push must still work', async () => {
    h.storage.map.set('sub:native', subRow({ endpoint: 'apns://devicetoken', userId: owner }))
    const res = await h.DO.fetch(post('/notify-owner', { ownerId: owner, alert: { title: 't', body: 'b', url: '/' } }))
    // Not an error, and not counted as sent — but the subscription survives.
    expect(await res.json()).toEqual({ ok: true, sent: 0 })
    expect(h.storage.map.has('sub:native')).toBe(true)
    expect(h.calls.filter((c) => c.url.includes('push.apple.com'))).toHaveLength(0)
  })
})

describe('AlertsDO /cron', () => {
  it('404s an unknown path', async () => {
    expect((await h.DO.fetch(new Request('https://do/nope'))).status).toBe(404)
  })

  it('scores every watched spot and reports what it did', async () => {
    h.storage.map.set('sub:a', subRow({ spotIds: ['bayshore-boulevard', 'curtis-hixon-waterfront-park'] }))
    const res = await h.DO.fetch(post('/cron', {}))
    const out = await res.json() as { checked: number; alerted: number; dropped: number }
    expect(out.checked).toBe(2)
    expect(out.alerted + out.dropped).toBeLessThanOrEqual(1)
  })

  it('skips a spot id that is no longer in the catalogue', async () => {
    h.storage.map.set('sub:a', subRow({ spotIds: ['retired-spot-id'] }))
    const out = await (await h.DO.fetch(post('/cron', {}))).json() as { checked: number }
    expect(out.checked).toBe(0)
  })

  it('does not alert twice for the same spot on the same day', async () => {
    h.storage.map.set('sub:a', subRow({ spotIds: ['bayshore-boulevard'] }))
    const dayTag = new Date().toISOString().slice(0, 10)
    h.storage.map.set('last:a:bayshore-boulevard', dayTag)

    const out = await (await h.DO.fetch(post('/cron', {}))).json() as { checked: number; alerted: number }
    expect(out.checked).toBe(1)
    expect(out.alerted).toBe(0)
    expect(h.storage.map.has('pending:a')).toBe(false)
  })
})
