/* Native push registration (J3 phase 4, 2026-07-29).

   The web path in client.ts is unreachable inside the wrapper: there is no
   service worker (native tears them down deliberately) and no PushManager, so
   `pushSupported()` is false and the CI capability probe reports `push=no`.
   Notifications were therefore silently dead in the iOS app.

   This is the native route. It ends at the SAME /api/push/subscribe endpoint,
   with the device token expressed as `apns://<token>` — so the watch list,
   spot selection and per-user routing on the server need no native-specific
   code at all. Only delivery differs, in the Worker.

   Structured as a pure `*With(deps)` core plus real wiring, like
   src/geo/position.ts and src/spots/capture.ts. */
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { apnsEndpointFor } from './apns'
import { apiUrl } from './api-base'
import { pushAuthHeaders } from './auth-header'

export interface NativePushDeps {
  isNative: boolean
  requestPermissions: () => Promise<{ receive: string }>
  register: () => Promise<void>
  /** Subscribe to the registration callback; returns an unsubscribe function. */
  onToken: (cb: (token: string) => void) => () => void
  /** Subscribe to the registration-ERROR callback; returns an unsubscribe
      function. Without it a failed registration is silence until the timeout. */
  onError: (cb: (message: string) => void) => () => void
  post: (path: string, body: unknown) => Promise<boolean>
  /** Persist the token once the server holds it. Only then is the device
      really subscribed — the stored token is what `alertsAreOn` reads. */
  remember: (token: string) => void
}

/** What actually happened, so the UI can say the true thing. Build 16 showed
    "notifications are blocked" for a dead network path because a boolean
    couldn't distinguish the failure modes.

    - `register-failed`: Apple answered with an error (or `register()` threw).
    - `no-token`: Apple never answered within the timeout. */
export type NativeEnableOutcome =
  | 'on' | 'unsupported' | 'denied' | 'register-failed' | 'no-token' | 'post-failed'

const TOKEN_TIMEOUT_MS = 10000
const POST_TIMEOUT_MS = 15000

/** A fetch on a stalled connection can sit far longer than anyone will watch
    a spinner, and WKWebView on iOS 15 has no AbortSignal.timeout. */
function within<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    p.then(
      (v) => { clearTimeout(timer); resolve(v) },
      () => { clearTimeout(timer); resolve(fallback) },
    )
  })
}

/**
 * Turn native alerts on: ask iOS, register with Apple, post the token.
 *
 * Never throws — a failed opt-in is not an error worth interrupting anyone
 * over — but the outcome names which step failed.
 */
export async function enableNativePushWith(
  deps: NativePushDeps,
  spotIds: string[],
  timeoutMs = TOKEN_TIMEOUT_MS,
  postTimeoutMs = POST_TIMEOUT_MS,
): Promise<NativeEnableOutcome> {
  if (!deps.isNative) return 'unsupported'

  const perm = await deps.requestPermissions().catch(() => ({ receive: 'denied' }))
  if (perm.receive !== 'granted') return 'denied'

  // The token arrives via a callback, not a return value, so bridge it to a
  // promise — and bound the wait. A silent registration failure must not leave
  // the settings toggle spinning forever.
  type TokenResult = { token: string } | { failed: 'no-token' | 'register-failed' }
  const result = await new Promise<TokenResult>((resolve) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    // `off` is deliberately `let`, assigned after: the listener may fire
    // SYNCHRONOUSLY (a token already cached by iOS), in which case `done` runs
    // before onToken has returned a handle. Referencing a `const` there is a
    // temporal-dead-zone crash — which is exactly how this was first written.
    let off: (() => void) | undefined
    let offErr: (() => void) | undefined
    const done = (r: TokenResult) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      off?.()
      offErr?.()
      resolve(r)
    }
    off = deps.onToken((token) => done({ token }))
    offErr = deps.onError(() => done({ failed: 'register-failed' }))
    if (settled) { off?.(); offErr?.() } // fired synchronously — tidy the listeners up now
    timer = setTimeout(() => done({ failed: 'no-token' }), timeoutMs)
    void deps.register().catch(() => done({ failed: 'register-failed' }))
  })
  if ('failed' in result) return result.failed

  const posted = await within(deps.post('/api/push/subscribe', {
    endpoint: apnsEndpointFor(result.token), spotIds,
  }), postTimeoutMs, false)
  if (!posted) return 'post-failed'
  deps.remember(result.token)
  return 'on'
}

export async function disableNativePushWith(deps: NativePushDeps, token: string | null): Promise<void> {
  if (!deps.isNative || !token) return
  await deps.post('/api/push/unsubscribe', { endpoint: apnsEndpointFor(token) }).catch(() => false)
}

export async function syncNativeWatchWith(
  deps: NativePushDeps, token: string | null, spotIds: string[],
): Promise<void> {
  if (!deps.isNative || !token) return
  await deps.post('/api/push/subscribe', {
    endpoint: apnsEndpointFor(token), spotIds,
  }).catch(() => false)
}

/* ── real wiring ───────────────────────────────────────────────────────── */

/** The device token, kept so the watch list can be updated and the device
    unsubscribed later. Registration is idempotent, so re-registering is fine. */
const TOKEN_KEY = 'vantage:apns-token'
export const storedApnsToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
const rememberToken = (t: string) => {
  try { localStorage.setItem(TOKEN_KEY, t) } catch { /* private mode */ }
}

export function nativePushDeps(): NativePushDeps {
  return {
    isNative: Capacitor.isNativePlatform(),
    requestPermissions: () => PushNotifications.requestPermissions(),
    register: () => PushNotifications.register(),
    onToken: (cb) => {
      const handle = PushNotifications.addListener('registration', (t: { value: string }) => {
        cb(t.value)
      })
      return () => { void Promise.resolve(handle).then((h) => h.remove()).catch(() => {}) }
    },
    onError: (cb) => {
      const handle = PushNotifications.addListener('registrationError', (e: { error: string }) => {
        // Apple's own wording (e.g. a missing aps-environment entitlement) —
        // visible in Safari Web Inspector when debugging on a device.
        console.warn('[push] APNs registration failed:', e.error)
        cb(e.error)
      })
      return () => { void Promise.resolve(handle).then((h) => h.remove()).catch(() => {}) }
    },
    post: async (path, body) => {
      // apiUrl: inside the wrapper the origin is capacitor://localhost, so a
      // relative /api fetch goes nowhere — the TestFlight build 16 alerts bug.
      const res = await fetch(apiUrl(path), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(await pushAuthHeaders()) },
        body: JSON.stringify(body),
      }).catch(() => null)
      return !!res && res.ok
    },
    remember: rememberToken,
  }
}

export const nativePushAvailable = () => Capacitor.isNativePlatform()

export const enableNativePush = (spotIds: string[]) =>
  enableNativePushWith(nativePushDeps(), spotIds)

export const disableNativePush = () =>
  disableNativePushWith(nativePushDeps(), storedApnsToken())

export const syncNativeWatch = (spotIds: string[]) =>
  syncNativeWatchWith(nativePushDeps(), storedApnsToken(), spotIds)
