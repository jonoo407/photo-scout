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

export interface NativePushDeps {
  isNative: boolean
  requestPermissions: () => Promise<{ receive: string }>
  register: () => Promise<void>
  /** Subscribe to the registration callback; returns an unsubscribe function. */
  onToken: (cb: (token: string) => void) => () => void
  post: (path: string, body: unknown) => Promise<boolean>
}

const TOKEN_TIMEOUT_MS = 10000

/**
 * Turn native alerts on: ask iOS, register with Apple, post the token.
 *
 * @returns false when the user declines, when we're on the web, or when Apple
 *   never calls back — never throws, because a failed opt-in is not an error
 *   worth interrupting anyone over.
 */
export async function enableNativePushWith(
  deps: NativePushDeps,
  spotIds: string[],
  userId: string | null,
  timeoutMs = TOKEN_TIMEOUT_MS,
): Promise<boolean> {
  if (!deps.isNative) return false

  const perm = await deps.requestPermissions().catch(() => ({ receive: 'denied' }))
  if (perm.receive !== 'granted') return false

  // The token arrives via a callback, not a return value, so bridge it to a
  // promise — and bound the wait. A silent registration failure must not leave
  // the settings toggle spinning forever.
  const token = await new Promise<string | null>((resolve) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    // `off` is deliberately `let`, assigned after: the listener may fire
    // SYNCHRONOUSLY (a token already cached by iOS), in which case `done` runs
    // before onToken has returned a handle. Referencing a `const` there is a
    // temporal-dead-zone crash — which is exactly how this was first written.
    let off: (() => void) | undefined
    const done = (t: string | null) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      off?.()
      resolve(t)
    }
    off = deps.onToken(done)
    if (settled) off?.() // fired synchronously — tidy the listener up now
    timer = setTimeout(() => done(null), timeoutMs)
    void deps.register().catch(() => done(null))
  })
  if (!token) return false

  return deps.post('/api/push/subscribe', {
    endpoint: apnsEndpointFor(token), spotIds, userId: userId ?? null,
  })
}

export async function disableNativePushWith(deps: NativePushDeps, token: string | null): Promise<void> {
  if (!deps.isNative || !token) return
  await deps.post('/api/push/unsubscribe', { endpoint: apnsEndpointFor(token) }).catch(() => false)
}

export async function syncNativeWatchWith(
  deps: NativePushDeps, token: string | null, spotIds: string[], userId: string | null,
): Promise<void> {
  if (!deps.isNative || !token) return
  await deps.post('/api/push/subscribe', {
    endpoint: apnsEndpointFor(token), spotIds, userId: userId ?? null,
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
        rememberToken(t.value)
        cb(t.value)
      })
      return () => { void Promise.resolve(handle).then((h) => h.remove()).catch(() => {}) }
    },
    post: async (path, body) => {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => null)
      return !!res && res.ok
    },
  }
}

export const nativePushAvailable = () => Capacitor.isNativePlatform()

export const enableNativePush = (spotIds: string[], userId: string | null) =>
  enableNativePushWith(nativePushDeps(), spotIds, userId)

export const disableNativePush = () =>
  disableNativePushWith(nativePushDeps(), storedApnsToken())

export const syncNativeWatch = (spotIds: string[], userId: string | null) =>
  syncNativeWatchWith(nativePushDeps(), storedApnsToken(), spotIds, userId)
