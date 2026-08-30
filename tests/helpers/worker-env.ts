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
export const subRow = (over: Partial<{ endpoint: string; spotIds: string[]; userId: string | null }> = {}) => ({
  endpoint: 'https://push.example.test/ep-1',
  spotIds: ['bayshore-boulevard'],
  createdAt: '2026-01-01T00:00:00.000Z',
  userId: null,
  ...over,
})
