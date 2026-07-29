import { describe, it, expect, vi } from 'vitest'
import {
  APNS_HOST_PRODUCTION, APNS_HOST_SANDBOX,
  apnsDeviceToken, isApnsEndpoint, apnsEndpointFor,
  buildApnsRequest, sendApnsWith, type ApnsConfig,
} from '../../src/push/apns'

/* Apple Push Notification service (APNs) delivery (J3 phase 4).

   Web push here is a TICKLE: an empty POST wakes the service worker, which
   fetches the queued alert. Native has no service worker — the wrapper tears
   any of them down — so the payload has to travel inside the push itself.

   A device token is stored as a subscription whose endpoint is
   `apns://<token>`, which lets the whole watch-list, spot-selection and
   user-routing machinery stay exactly as it is. Only the send branches. */

const cfg: ApnsConfig = {
  teamId: 'JCMQ35RNF2',
  keyId: '7H94N68KH8',
  // A throwaway P-256 key generated for this suite; not Apple's.
  privateKeyPem: [
    '-----BEGIN PRIVATE KEY-----',
    'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgevZzL1gdAFr88hb2',
    'OF/2NxApJCzGCEDdfSp6VQO30hyhRANCAAQRWz+jn65BtOMvdyHKcvjBeBSDZH2r',
    '1RTwjmYSi9R/zpBnuQ4EiMnCqfMPWiZqB4QdbAd0E7oH50VpuZ1P087G',
    '-----END PRIVATE KEY-----',
  ].join('\n'),
  bundleId: 'com.shootvantage.app',
}

describe('apns endpoints', () => {
  it('recognises an APNs subscription and leaves web push alone', () => {
    expect(isApnsEndpoint('apns://abc123')).toBe(true)
    expect(isApnsEndpoint('https://fcm.googleapis.com/fcm/send/xyz')).toBe(false)
  })

  it('round-trips a device token through the endpoint form', () => {
    const ep = apnsEndpointFor('DEADBEEF00')
    expect(isApnsEndpoint(ep)).toBe(true)
    expect(apnsDeviceToken(ep)).toBe('DEADBEEF00')
  })

  it('returns null for a token it cannot extract', () => {
    expect(apnsDeviceToken('https://example.com/x')).toBeNull()
    expect(apnsDeviceToken('apns://')).toBeNull()
  })
})

describe('buildApnsRequest', () => {
  it('targets the device on the production host by default', async () => {
    const r = await buildApnsRequest(cfg, 'TOKEN123', { title: 'Golden hour', body: 'Bayshore looks good' })
    expect(r.url).toBe(`${APNS_HOST_PRODUCTION}/3/device/TOKEN123`)
  })

  it('can target the sandbox host, which is what Xcode builds register against', async () => {
    const r = await buildApnsRequest(cfg, 'TOKEN123', { title: 'a', body: 'b' }, { sandbox: true })
    expect(r.url).toBe(`${APNS_HOST_SANDBOX}/3/device/TOKEN123`)
  })

  it('sends the topic, push type and priority Apple requires', async () => {
    const r = await buildApnsRequest(cfg, 'T', { title: 'a', body: 'b' })
    expect(r.headers['apns-topic']).toBe('com.shootvantage.app')
    expect(r.headers['apns-push-type']).toBe('alert')
    expect(r.headers['apns-priority']).toBe('10')
  })

  it('signs with an ES256 token naming the key id', async () => {
    const r = await buildApnsRequest(cfg, 'T', { title: 'a', body: 'b' })
    const jwt = r.headers.authorization.replace(/^bearer /, '')
    const [head, body] = jwt.split('.')
    const h = JSON.parse(Buffer.from(head, 'base64url').toString())
    const p = JSON.parse(Buffer.from(body, 'base64url').toString())
    expect(h).toMatchObject({ alg: 'ES256', kid: '7H94N68KH8' })
    expect(p.iss).toBe('JCMQ35RNF2')
    expect(typeof p.iat).toBe('number')
  })

  it('carries the alert text in the payload — native has no worker to fetch it', async () => {
    const r = await buildApnsRequest(cfg, 'T', { title: 'Golden hour', body: 'Bayshore looks good', url: '/spot/bayshore-boulevard' })
    const payload = JSON.parse(r.body)
    expect(payload.aps.alert).toEqual({ title: 'Golden hour', body: 'Bayshore looks good' })
    expect(payload.url).toBe('/spot/bayshore-boulevard')
  })
})

describe('sendApnsWith', () => {
  const ok = () => ({ status: 200, text: async () => '' })

  it('reports success', async () => {
    const fetchImpl = vi.fn(async () => ok())
    const res = await sendApnsWith(fetchImpl as never, cfg, 'T', { title: 'a', body: 'b' })
    expect(res).toEqual({ ok: true, gone: false })
  })

  it('retries against sandbox when production rejects the token', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ status: 400, text: async () => '{"reason":"BadDeviceToken"}' })
      .mockResolvedValueOnce(ok())
    const res = await sendApnsWith(fetchImpl as never, cfg, 'T', { title: 'a', body: 'b' })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(String(fetchImpl.mock.calls[1][0])).toContain('sandbox')
    expect(res.ok).toBe(true)
  })

  it('marks a device gone when Apple says the token is unregistered', async () => {
    const fetchImpl = vi.fn(async () => ({ status: 410, text: async () => '{"reason":"Unregistered"}' }))
    const res = await sendApnsWith(fetchImpl as never, cfg, 'T', { title: 'a', body: 'b' })
    expect(res).toEqual({ ok: false, gone: true })
  })

  it('does not treat a bad token on BOTH hosts as merely a retry', async () => {
    const fetchImpl = vi.fn(async () => ({ status: 400, text: async () => '{"reason":"BadDeviceToken"}' }))
    const res = await sendApnsWith(fetchImpl as never, cfg, 'T', { title: 'a', body: 'b' })
    expect(res.gone).toBe(true)
  })

  it('survives a network failure without throwing', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('offline') })
    const res = await sendApnsWith(fetchImpl as never, cfg, 'T', { title: 'a', body: 'b' })
    expect(res).toEqual({ ok: false, gone: false })
  })
})
