import { describe, it, expect } from 'vitest'
import { generateVapidKeys, vapidAuthHeader, b64urlToBytes } from '../../src/push/vapid'

const decodeJson = (b64: string) => JSON.parse(new TextDecoder().decode(b64urlToBytes(b64)))

describe('VAPID', () => {
  it('generates a P-256 pair with a 65-byte uncompressed public key', async () => {
    const { publicKeyB64, privateJwk } = await generateVapidKeys()
    const pub = b64urlToBytes(publicKeyB64)
    expect(pub.length).toBe(65)
    expect(pub[0]).toBe(4)
    expect(privateJwk.kty).toBe('EC')
    expect(privateJwk.crv).toBe('P-256')
    expect(privateJwk.d).toBeTruthy()
  })

  it('builds an Authorization header whose JWT verifies against the public key', async () => {
    const keys = await generateVapidKeys()
    const header = await vapidAuthHeader('https://fcm.googleapis.com/fcm/send/abc123', keys, 'mailto:alerts@shootvantage.com')
    expect(header).toMatch(/^vapid t=.+, k=.+$/)

    const jwt = /t=([^,]+)/.exec(header)![1]
    const k = /k=(.+)$/.exec(header)![1]
    expect(k).toBe(keys.publicKeyB64)

    const [h, p, sig] = jwt.split('.')
    expect(decodeJson(h)).toEqual({ typ: 'JWT', alg: 'ES256' })
    const claims = decodeJson(p)
    expect(claims.aud).toBe('https://fcm.googleapis.com')
    expect(claims.sub).toBe('mailto:alerts@shootvantage.com')
    expect(claims.exp).toBeGreaterThan(Date.now() / 1000)

    const pubKey = await crypto.subtle.importKey(
      'jwk', { kty: 'EC', crv: 'P-256', x: keys.privateJwk.x, y: keys.privateJwk.y },
      { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'],
    )
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' }, pubKey,
      b64urlToBytes(sig), new TextEncoder().encode(`${h}.${p}`),
    )
    expect(ok).toBe(true)
  })
})
