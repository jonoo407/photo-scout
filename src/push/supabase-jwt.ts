/* Supabase access-token verification for the Worker (2026-09-24).

   /api/push/subscribe used to trust a `userId` in the request body, so anyone
   could bind their own device to someone else's account and receive that
   photographer's client-response notifications. The Worker now takes the user
   id ONLY from a verified Supabase access token.

   The project signs with an asymmetric key (ES256 today) and publishes the
   public half at /auth/v1/.well-known/jwks.json, so verification is local
   WebCrypto with no shared secret to provision. Symmetric (HS256) tokens are
   refused outright: this project no longer issues them, and accepting one
   would need the legacy JWT secret in the Worker. */

export interface Jwk {
  kid?: string
  kty: string
  alg?: string
  crv?: string
  x?: string
  y?: string
  n?: string
  e?: string
}

export type KeySource = (opts?: { refresh?: boolean }) => Promise<Jwk[]>

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CLOCK_SKEW_SECONDS = 30

const ALGS = {
  ES256: {
    importParams: { name: 'ECDSA', namedCurve: 'P-256' },
    verifyParams: { name: 'ECDSA', hash: 'SHA-256' },
  },
  RS256: {
    importParams: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    verifyParams: { name: 'RSASSA-PKCS1-v1_5' },
  },
} as const

function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

function decodeJson(part: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(new TextDecoder().decode(b64urlDecode(part)))
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null
  } catch {
    return null
  }
}

/**
 * The user id (`sub`) of a valid, unexpired Supabase access token for a
 * signed-in user, or null for anything else. Never throws.
 */
export async function verifySupabaseJwt(
  token: string,
  opts: { issuer: string; keys: KeySource; nowSeconds?: number },
): Promise<string | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [h, p, s] = parts
    const header = decodeJson(h)
    const claims = decodeJson(p)
    if (!header || !claims) return null

    const alg = header.alg
    if (alg !== 'ES256' && alg !== 'RS256') return null
    const kid = typeof header.kid === 'string' ? header.kid : null
    if (!kid) return null

    const pick = (keys: Jwk[]) => keys.find((k) => k.kid === kid && (!k.alg || k.alg === alg))
    // An unknown kid is what a key rotation looks like from here, so refetch
    // once before giving up.
    const jwk = pick(await opts.keys()) ?? pick(await opts.keys({ refresh: true }))
    if (!jwk) return null

    const { importParams, verifyParams } = ALGS[alg]
    const key = await crypto.subtle.importKey('jwk', jwk as JsonWebKey, importParams, false, ['verify'])
    const ok = await crypto.subtle.verify(
      verifyParams, key, b64urlDecode(s) as BufferSource, new TextEncoder().encode(`${h}.${p}`),
    )
    if (!ok) return null

    const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000)
    if (typeof claims.exp !== 'number' || claims.exp <= now - CLOCK_SKEW_SECONDS) return null
    if (typeof claims.nbf === 'number' && claims.nbf > now + CLOCK_SKEW_SECONDS) return null
    if (claims.iss !== opts.issuer) return null
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
    if (!aud.includes('authenticated')) return null
    // The publishable key's own JWT (role anon) must never pass as a user.
    if (claims.role !== 'authenticated') return null
    if (typeof claims.sub !== 'string' || !UUID_RE.test(claims.sub)) return null
    return claims.sub.toLowerCase()
  } catch {
    return null
  }
}

/**
 * A cached JWKS fetcher. Keys are held for `ttlMs`; a forced refresh (unknown
 * kid) is honoured at most once per `minRefreshMs`, so a stream of tokens with
 * made-up kids cannot turn the Worker into a JWKS-fetching amplifier.
 */
export function jwksSource(
  url: string,
  fetchImpl: (url: string) => Promise<Response>,
  { ttlMs = 10 * 60_000, minRefreshMs = 30_000, now = () => Date.now() } = {},
): KeySource {
  let keys: Jwk[] | null = null
  let fetchedAt = 0
  return async ({ refresh = false } = {}) => {
    const age = now() - fetchedAt
    const stale = !keys || age >= ttlMs
    if (stale || (refresh && age >= minRefreshMs)) {
      const res = await fetchImpl(url).catch(() => null)
      if (res && res.ok) {
        const body = (await res.json().catch(() => null)) as { keys?: Jwk[] } | null
        if (Array.isArray(body?.keys)) {
          keys = body.keys
          fetchedAt = now()
        }
      }
    }
    return keys ?? []
  }
}
