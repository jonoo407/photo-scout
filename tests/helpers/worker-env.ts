import { vi } from 'vitest'
import { AlertsDO } from '../../worker/index'

/* Test harness for the Cloudflare Worker.
 *
 * The Worker's only runtime dependencies are a Durable Object namespace, an
 * assets binding and `fetch` — all three are small enough to fake outright, so
 * these tests need no Miniflare or workerd. `DOStorage` is four methods over a
 * Map; the DO namespace hands back a real `AlertsDO` so the outer routes
 * exercise the genuine object rather than a stub of it. */

export interface FakeStorage {
  map: Map<string, unknown>
  get<T>(key: string): Promise<T | undefined>
  put(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<boolean>
  list<T>(opts?: { prefix?: string }): Promise<Map<string, T>>
}

export function fakeStorage(seed: Record<string, unknown> = {}): FakeStorage {
  const map = new Map<string, unknown>(Object.entries(seed))
  return {
    map,
    async get<T>(key: string) { return map.get(key) as T | undefined },
    async put(key: string, value: unknown) { map.set(key, value) },
    async delete(key: string) { return map.delete(key) },
    async list<T>(opts?: { prefix?: string }) {
      const prefix = opts?.prefix ?? ''
      return new Map(
        [...map.entries()].filter(([k]) => k.startsWith(prefix)) as Array<[string, T]>,
      )
    },
  }
}

export interface Harness {
  env: any
  storage: FakeStorage
  DO: AlertsDO
  /** Every request the Worker made to the outside world, in order. */
  calls: Array<{ url: string; init?: RequestInit }>
  assetRequests: Request[]
}

/**
 * Build an Env whose ALERTS namespace resolves to a real AlertsDO over
 * `storage`, and whose ASSETS binding records what fell through to it.
 *
 * `fetchImpl` stands in for the global — return a Response per URL to script
 * Supabase RPCs, Resend and web-push endpoints.
 */
export function harness(
  overrides: Record<string, unknown> = {},
  fetchImpl: (url: string, init?: RequestInit) => Response | Promise<Response> =
    () => new Response('{}', { status: 200 }),
): Harness {
  const storage = fakeStorage()
  const calls: Harness['calls'] = []
  const assetRequests: Request[] = []

  const env: any = {
    SUPABASE_URL: 'https://db.example.test',
    SUPABASE_PUBLISHABLE_KEY: 'anon-key',
    ASSETS: {
      async fetch(req: Request) {
        assetRequests.push(req)
        return new Response('<!doctype html><title>app shell</title>', {
          headers: { 'content-type': 'text/html' },
        })
      },
    },
    ...overrides,
  }

  const DO = new AlertsDO({ storage } as never, env)
  env.ALERTS = {
    idFromName: (name: string) => name,
    get: () => ({ fetch: (req: Request | string, init?: RequestInit) => DO.fetch(new Request(req as string, init)) }),
  }

  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as Request).url ?? String(input)
    calls.push({ url, init })
    return fetchImpl(url, init)
  }))

  return { env, storage, DO, calls, assetRequests }
}

/** A subscription row as `/subscribe` would have written it. */
export const subRow = (
  over: Partial<{ endpoint: string; spotIds: string[]; userId: string | null; verified: boolean; createdAt: string }> = {},
) => ({
  endpoint: 'https://push.example.test/ep-1',
  spotIds: ['bayshore-boulevard'],
  createdAt: '2026-01-01T00:00:00.000Z',
  userId: null,
  verified: true,
  ...over,
})

const b64url = (bytes: Uint8Array | string) => {
  const raw = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes
  return btoa(String.fromCharCode(...raw)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export interface JwtKit {
  jwks: { keys: JsonWebKey[] }
  /** A Supabase-shaped access token for `sub`; `claims` override the defaults. */
  sign(sub: string, claims?: Record<string, unknown>, header?: Record<string, unknown>): Promise<string>
}

/**
 * A real ES256 key pair standing in for the Supabase project's signing key.
 * Tokens are signed with the genuine algorithm so the Worker's verifier runs
 * exactly as it does in production.
 */
export async function jwtKit(issuer = 'https://db.example.test/auth/v1', kid = 'test-kid'): Promise<JwtKit> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const pub = await crypto.subtle.exportKey('jwk', pair.publicKey)
  return {
    jwks: { keys: [{ ...pub, kid, alg: 'ES256', use: 'sig' } as JsonWebKey] },
    async sign(sub, claims = {}, header = {}) {
      const now = Math.floor(Date.now() / 1000)
      const h = b64url(JSON.stringify({ alg: 'ES256', typ: 'JWT', kid, ...header }))
      const p = b64url(JSON.stringify({
        sub, iss: issuer, aud: 'authenticated', role: 'authenticated', exp: now + 3600, iat: now, ...claims,
      }))
      const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, new TextEncoder().encode(`${h}.${p}`))
      return `${h}.${p}.${b64url(new Uint8Array(sig))}`
    },
  }
}

/** A fetchImpl that serves `kit`'s JWKS and hands everything else to `rest`. */
export const withJwks = (
  kit: JwtKit,
  rest: (url: string, init?: RequestInit) => Response | Promise<Response> = () => new Response('{}', { status: 200 }),
) => (url: string, init?: RequestInit) =>
  url.endsWith('/auth/v1/.well-known/jwks.json') ? new Response(JSON.stringify(kit.jwks)) : rest(url, init)
