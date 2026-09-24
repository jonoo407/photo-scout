import { describe, it, expect, vi } from 'vitest'
import { verifySupabaseJwt, jwksSource, type Jwk } from '../../src/push/supabase-jwt'
import { jwtKit } from '../helpers/worker-env'
import { hookSecretMatches } from '../../src/push/hook-secret'
import { take, expired } from '../../src/push/rate-limit'

/* The token check behind /api/push/subscribe. The Worker suite proves the
   attacks fail end to end; this covers the pieces it composes. */

const ISS = 'https://db.example.test/auth/v1'
const USER = '11111111-2222-4333-8444-555555555555'

describe('verifySupabaseJwt', () => {
  it('returns the lower-cased sub of a valid ES256 token', async () => {
    const kit = await jwtKit(ISS)
    const token = await kit.sign(USER.toUpperCase())
    expect(await verifySupabaseJwt(token, { issuer: ISS, keys: async () => kit.jwks.keys as Jwk[] })).toBe(USER)
  })

  it('accepts an audience list that includes authenticated', async () => {
    const kit = await jwtKit(ISS)
    const token = await kit.sign(USER, { aud: ['other', 'authenticated'] })
    expect(await verifySupabaseJwt(token, { issuer: ISS, keys: async () => kit.jwks.keys as Jwk[] })).toBe(USER)
  })

  it('verifies RS256 too, should the project rotate to an RSA key', async () => {
    const pair = await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true, ['sign', 'verify'],
    )
    const jwk = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid: 'rsa', alg: 'RS256' } as Jwk
    const enc = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const h = enc({ alg: 'RS256', kid: 'rsa' })
    const p = enc({ sub: USER, iss: ISS, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 60 })
    const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(`${h}.${p}`)))
    const s = btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(await verifySupabaseJwt(`${h}.${p}.${s}`, { issuer: ISS, keys: async () => [jwk] })).toBe(USER)
  })

  it('refetches keys once for an unknown kid (a rotation), then succeeds', async () => {
    const kit = await jwtKit(ISS, 'new-kid')
    const keys = vi.fn(async (opts?: { refresh?: boolean }) => (opts?.refresh ? kit.jwks.keys as Jwk[] : []))
    expect(await verifySupabaseJwt(await kit.sign(USER), { issuer: ISS, keys })).toBe(USER)
    expect(keys).toHaveBeenCalledWith({ refresh: true })
  })

  it('tolerates small clock skew on exp but not an hour', async () => {
    const kit = await jwtKit(ISS)
    const now = Math.floor(Date.now() / 1000)
    const keys = async () => kit.jwks.keys as Jwk[]
    expect(await verifySupabaseJwt(await kit.sign(USER, { exp: now - 5 }), { issuer: ISS, keys })).toBe(USER)
    expect(await verifySupabaseJwt(await kit.sign(USER, { exp: now - 3600 }), { issuer: ISS, keys })).toBeNull()
    expect(await verifySupabaseJwt(await kit.sign(USER, { exp: undefined }), { issuer: ISS, keys })).toBeNull()
  })
})

describe('jwksSource', () => {
  const body = { keys: [{ kid: 'a', kty: 'EC' }] }

  it('caches keys for the TTL', async () => {
    let t = 0
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(body)))
    const src = jwksSource('https://x/jwks', fetchImpl, { ttlMs: 1000, now: () => t })
    await src(); await src()
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    t = 1000
    await src()
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('throttles forced refreshes so made-up kids cannot hammer the JWKS endpoint', async () => {
    let t = 0
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(body)))
    const src = jwksSource('https://x/jwks', fetchImpl, { minRefreshMs: 30_000, now: () => t })
    await src()
    for (let i = 0; i < 50; i++) await src({ refresh: true })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    t = 30_000
    await src({ refresh: true })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('keeps the last good keys when a refetch fails', async () => {
    let t = 0
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(body)))
    const src = jwksSource('https://x/jwks', fetchImpl, { ttlMs: 10, now: () => t })
    await src()
    fetchImpl.mockImplementation(async () => new Response('down', { status: 503 }))
    t = 100
    expect(await src()).toEqual(body.keys)
  })

  it('returns no keys when the endpoint never answered', async () => {
    const src = jwksSource('https://x/jwks', async () => { throw new Error('offline') })
    expect(await src()).toEqual([])
  })
})

describe('hookSecretMatches', () => {
  it('matches only the exact secret', async () => {
    expect(await hookSecretMatches('s3cret', 's3cret')).toBe(true)
    for (const v of ['s3cre', 's3cret ', 'S3CRET', '']) expect(await hookSecretMatches('s3cret', v)).toBe(false)
  })

  it('never matches when either side is missing', async () => {
    expect(await hookSecretMatches(undefined, 'x')).toBe(false)
    expect(await hookSecretMatches('', '')).toBe(false)
    expect(await hookSecretMatches('x', null)).toBe(false)
  })
})

describe('rate-limit windows', () => {
  it('counts up to the limit, then refuses until the window ends', () => {
    let w = take(undefined, 2, 1000, 0).next
    expect(w.count).toBe(1)
    w = take(w, 2, 1000, 10).next
    expect(take(w, 2, 1000, 20).allowed).toBe(false)
    expect(take(w, 2, 1000, 1000)).toEqual({ allowed: true, next: { start: 1000, count: 1, windowMs: 1000 } })
  })

  it('knows when a window is over', () => {
    expect(expired({ start: 0, count: 1, windowMs: 1000 }, 999)).toBe(false)
    expect(expired({ start: 0, count: 1, windowMs: 1000 }, 1000)).toBe(true)
  })
})
