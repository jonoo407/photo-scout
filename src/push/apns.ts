/* Apple Push Notification service (APNs) delivery (J3 phase 4, 2026-07-29).

   Web push in this app is a TICKLE: an empty POST wakes the service worker,
   which then fetches the queued alert from /api/push/pending. That model does
   not survive the native wrapper, which deliberately registers no service
   worker at all (src/pwa/native.ts) — so an APNs push has to carry its own
   payload.

   A device token is stored as an ordinary Subscription whose endpoint is
   `apns://<token>`. Every bit of existing machinery — the watch list, the
   spot selection, the per-user routing, the dedupe keys — then works
   unchanged, and only the send step branches on the scheme.

   Token-based auth (a .p8 key) rather than certificates: no annual expiry to
   forget, and one key covers every environment. WebCrypto only. */

export const APNS_HOST_PRODUCTION = 'https://api.push.apple.com'
export const APNS_HOST_SANDBOX = 'https://api.sandbox.push.apple.com'

export interface ApnsConfig {
  teamId: string
  keyId: string
  /** Contents of the AuthKey_XXXXXXXXXX.p8 file. */
  privateKeyPem: string
  bundleId: string
}

export interface ApnsAlert {
  title: string
  body: string
  /** In-app route to open on tap. */
  url?: string
}

const PREFIX = 'apns://'

export const apnsEndpointFor = (deviceToken: string) => `${PREFIX}${deviceToken}`
export const isApnsEndpoint = (endpoint: string) => endpoint.startsWith(PREFIX)

export function apnsDeviceToken(endpoint: string): string | null {
  if (!isApnsEndpoint(endpoint)) return null
  const token = endpoint.slice(PREFIX.length).trim()
  return token || null
}

const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '')
  const bin = atob(body)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/* Apple rejects a token younger than 20 minutes on refresh and older than 60,
   so one is minted per hour and reused. Signing on every push would also be
   wasteful — ES256 is not free. */
let cached: { jwt: string; mintedAt: number; keyId: string } | null = null

export async function apnsJwt(cfg: ApnsConfig, nowMs = Date.now()): Promise<string> {
  if (cached && cached.keyId === cfg.keyId && nowMs - cached.mintedAt < 45 * 60 * 1000) {
    return cached.jwt
  }
  const iat = Math.floor(nowMs / 1000)
  const head = b64url(JSON.stringify({ alg: 'ES256', kid: cfg.keyId, typ: 'JWT' }))
  const body = b64url(JSON.stringify({ iss: cfg.teamId, iat }))

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(cfg.privateKeyPem) as BufferSource,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
  // WebCrypto returns raw R||S, which is exactly what JOSE wants — unlike
  // Node's default DER for elliptic-curve keys.
  const sig = new Uint8Array(await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(`${head}.${body}`),
  ))
  let bin = ''
  for (const b of sig) bin += String.fromCharCode(b)
  const jwt = `${head}.${body}.${b64url(bin)}`
  cached = { jwt, mintedAt: nowMs, keyId: cfg.keyId }
  return jwt
}

export interface ApnsRequest {
  url: string
  headers: Record<string, string>
  body: string
}

export async function buildApnsRequest(
  cfg: ApnsConfig,
  deviceToken: string,
  alert: ApnsAlert,
  opts: { sandbox?: boolean } = {},
): Promise<ApnsRequest> {
  const host = opts.sandbox ? APNS_HOST_SANDBOX : APNS_HOST_PRODUCTION
  return {
    url: `${host}/3/device/${deviceToken}`,
    headers: {
      authorization: `bearer ${await apnsJwt(cfg)}`,
      'apns-topic': cfg.bundleId,
      'apns-push-type': 'alert',
      // 10 = deliver immediately. These are time-sensitive by nature: an alert
      // about tonight's light is worthless tomorrow.
      'apns-priority': '10',
      'apns-expiration': String(Math.floor(Date.now() / 1000) + 6 * 3600),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      aps: { alert: { title: alert.title, body: alert.body }, sound: 'default' },
      ...(alert.url ? { url: alert.url } : {}),
    }),
  }
}

export interface ApnsResult {
  ok: boolean
  /** The device is no longer reachable — drop the subscription. */
  gone: boolean
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  status: number
  text: () => Promise<string>
}>

/**
 * Deliver one push.
 *
 * Tries production first and falls back to sandbox on BadDeviceToken, because
 * a token's environment depends on how the app was built — TestFlight and the
 * App Store are production, an Xcode debug build is sandbox — and the server
 * has no way to know which produced a given token.
 */
export async function sendApnsWith(
  fetchImpl: FetchLike,
  cfg: ApnsConfig,
  deviceToken: string,
  alert: ApnsAlert,
): Promise<ApnsResult> {
  const attempt = async (sandbox: boolean): Promise<{ status: number; reason: string } | null> => {
    try {
      const req = await buildApnsRequest(cfg, deviceToken, alert, { sandbox })
      const res = await fetchImpl(req.url, { method: 'POST', headers: req.headers, body: req.body })
      let reason = ''
      if (res.status >= 400) {
        try { reason = String(JSON.parse(await res.text())?.reason ?? '') } catch { /* body may be empty */ }
      }
      return { status: res.status, reason }
    } catch {
      return null // network failure — not the device's fault, so never "gone"
    }
  }

  let r = await attempt(false)
  if (r && r.status === 400 && r.reason === 'BadDeviceToken') r = await attempt(true)
  if (!r) return { ok: false, gone: false }
  if (r.status >= 200 && r.status < 300) return { ok: true, gone: false }

  // 410 Unregistered, or a token bad in BOTH environments, means stop trying.
  const gone = r.status === 410 || r.reason === 'Unregistered' || r.reason === 'BadDeviceToken'
  return { ok: false, gone }
}
