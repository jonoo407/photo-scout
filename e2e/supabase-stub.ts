import type { Page, Route } from '@playwright/test'

/*
 * A stand-in Supabase for the guest suite. The e2e-auth build points at
 * https://stub.supabase.test (see .env.e2e-auth) — a host that does not exist —
 * and every request to it is answered here, so the suite is hermetic and runs
 * with no secrets. It is deliberately permissive: reads return no rows, writes
 * succeed, and any sign-in (password, sign-up, or the Google PKCE round trip)
 * yields the same test user. What is under test is the app's behaviour around
 * auth, not Supabase.
 */

export const STUB_ORIGIN = 'https://stub.supabase.test'

export const E2E_USER = {
  id: '0e2e0e2e-0000-4000-8000-00000000e2e0',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'guest.e2e@example.test',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  created_at: '2026-09-24T00:00:00Z',
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'access-control-expose-headers': '*',
}

const b64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')

function session() {
  const exp = Math.floor(Date.now() / 1000) + 3600
  const jwt = [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: E2E_USER.id, email: E2E_USER.email, role: 'authenticated', aud: 'authenticated', exp }),
    'e2e-signature',
  ].join('.')
  return {
    access_token: jwt,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    refresh_token: 'e2e-refresh-token',
    user: E2E_USER,
  }
}

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(body) })

/**
 * Answer every Supabase request from `page`. `appOrigin` is where the Google
 * authorize step redirects back to (with a one-time ?code=, as the real one
 * does). Returns the log of requests, "METHOD /path?query", for assertions.
 */
export async function stubSupabase(page: Page, appOrigin: string): Promise<string[]> {
  const calls: string[] = []
  await page.route(`${STUB_ORIGIN}/**`, async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    calls.push(`${req.method()} ${path}${url.search}`)

    if (path === '/auth/v1/authorize') {
      // Stands in for Google's consent screen. A page that sends the browser
      // back, not a 302: WebKit's route.fulfill refuses redirect statuses.
      const back = JSON.stringify(`${appOrigin}/?code=e2e-oauth-code`)
      return route.fulfill({ status: 200, contentType: 'text/html', body: `<script>location.replace(${back})</script>` })
    }
    if (path === '/auth/v1/token' || path === '/auth/v1/signup') return json(route, session())
    if (path === '/auth/v1/user') return json(route, E2E_USER)
    if (path === '/auth/v1/logout') return route.fulfill({ status: 204, headers: CORS })
    if (path.startsWith('/rest/v1/rpc/') || (path.startsWith('/rest/v1/') && req.method() === 'GET')) {
      return json(route, [])
    }
    if (path.startsWith('/rest/v1/')) return route.fulfill({ status: 201, headers: CORS, body: '' })
    if (path.startsWith('/storage/v1/')) return json(route, [])
    return json(route, { message: `e2e stub: no handler for ${path}` }, 404)
  })
  return calls
}
