/* Cloudflare Worker for shootvantage.com: serves the built app (assets
   binding) and runs the conditions-alert machinery — subscription store,
   VAPID keys, and the daily cron that scores tonight's watched spots and
   sends web-push tickles. State lives in one SQLite Durable Object, so the
   whole thing deploys from git with no dashboard secrets.

   Push model: tickle only (no payload/encryption). The service worker wakes,
   fetches /api/push/pending, and shows the queued notification(s). */

import TAMPA from '../src/data/spots/tampa-bay'
import PHILLY from '../src/data/spots/philadelphia'
import { scoreBestDay, windowTimeFor } from '../src/spots/best-days'
import { fetchSkyForecast, skyScoreAt, type SkyHourly } from '../src/weather/open-meteo'
import { shouldAlert, alertMessage, type AlertPayload } from '../src/push/alert-rules'
import { generateVapidKeys, vapidAuthHeader, bytesToB64url, type VapidKeys } from '../src/push/vapid'
import { listOgHtml } from '../src/spots/list-og'
import { responseEmail } from '../src/push/response-email'
import { apnsDeviceToken, sendApnsWith, type ApnsConfig } from '../src/push/apns'
import { verifySvixSignature } from '../src/push/svix'
import { buildForward, receivedEmailId, type ReceivedEmail } from '../src/push/forward-mail'
import { verifySupabaseJwt, jwksSource, type KeySource } from '../src/push/supabase-jwt'
import { HOOK_SECRET_HEADER, hookSecretMatches } from '../src/push/hook-secret'
import { take, expired, type Window } from '../src/push/rate-limit'
import type { Spot } from '../src/spots/types'

const ALL_SPOTS = new Map<string, Spot>([...TAMPA, ...PHILLY].map((s) => [s.id, s]))
const VAPID_SUBJECT = 'mailto:alerts@shootvantage.com'
const MAX_WATCHED = 20
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/* Abuse limits. Every subscription is walked by the single-threaded cron, and
   every hook email spends Resend quota that password-reset mail also needs
   (free tier: 100/day), so both are capped well below what would hurt. */
const MAX_SUBS_PER_USER = 10
const MAX_SUBSCRIPTIONS = 5000
const HOUR = 3600
const DAY = 86400
export const LIMITS = {
  subscribePerUser: { limit: 60, windowSec: HOUR },
  pushWritesPerIp: { limit: 120, windowSec: HOUR },
  notifyPerOwner: { limit: 30, windowSec: HOUR },
  feedbackEmails: { limit: 10, windowSec: HOUR },
  reportEmails: { limit: 20, windowSec: HOUR },
  hookEmailsPerDay: { limit: 50, windowSec: DAY },
} as const

interface Subscription {
  endpoint: string
  spotIds: string[]
  createdAt: string
  /** Supabase auth user id — routes client-response notifications to the
      right device. */
  userId?: string | null
  /** Set when userId came from a verified access token. Rows written before
      2026-09-24 took userId from the request body and are never notified. */
  verified?: boolean
}

/* Minimal structural types so the app's tsconfig never needs workers-types. */
interface DOStorage {
  get<T = unknown>(key: string): Promise<T | undefined>
  put(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<boolean>
  list<T = unknown>(opts?: { prefix?: string }): Promise<Map<string, T>>
}
interface DOState { storage: DOStorage }
interface DONamespace {
  idFromName(name: string): unknown
  get(id: unknown): { fetch(req: Request | string, init?: RequestInit): Promise<Response> }
}
interface Env {
  ALERTS: DONamespace
  ASSETS: { fetch(req: Request): Promise<Response> }
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  /** Worker secrets (dashboard/wrangler) — email leg no-ops without them. */
  RESEND_API_KEY?: string
  SUPABASE_HOOK_SECRET?: string
  /** Svix signing secret for the Resend inbound-mail webhook (`whsec_…`).
      Without it /api/inbound-mail refuses everything — an unverified forwarder
      is an open relay wearing our return address. */
  RESEND_WEBHOOK_SECRET?: string
  /** Where support@shootvantage.com is forwarded. */
  SUPPORT_FORWARD_TO?: string
  /* Apple Push Notification service (J3 phase 4). Without all three, native
     devices simply never get pushed — web push is unaffected. */
  APNS_TEAM_ID?: string
  APNS_KEY_ID?: string
  /** Contents of the AuthKey_XXXXXXXXXX.p8 file. */
  APNS_PRIVATE_KEY?: string
}

/** APNs config, or null when the Worker hasn't been given the key. */
function apnsConfig(env: Env): ApnsConfig | null {
  if (!env.APNS_TEAM_ID || !env.APNS_KEY_ID || !env.APNS_PRIVATE_KEY) return null
  return {
    teamId: env.APNS_TEAM_ID,
    keyId: env.APNS_KEY_ID,
    privateKeyPem: env.APNS_PRIVATE_KEY,
    bundleId: 'com.shootvantage.app',
  }
}

/* Per-env rather than module-global so a test's fresh Env gets fresh keys;
   in production the isolate's Env is reused and the cache holds. */
const keySources = new WeakMap<object, KeySource>()
function supabaseKeys(env: Env): KeySource {
  let src = keySources.get(env)
  if (!src) {
    src = jwksSource(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`, (u) => fetch(u))
    keySources.set(env, src)
  }
  return src
}

/** The verified Supabase user id behind `Authorization: Bearer …`, or null. */
async function requestUser(request: Request, env: Env): Promise<string | null> {
  const m = /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') ?? '')
  if (!m) return null
  return verifySupabaseJwt(m[1], { issuer: `${env.SUPABASE_URL}/auth/v1`, keys: supabaseKeys(env) })
}

/** Spend one unit of a DO-held rate-limit bucket; false once it is empty. */
async function allow(env: Env, bucket: string, rule: { limit: number; windowSec: number }): Promise<boolean> {
  const res = await doStub(env).fetch(new Request('https://do/ratelimit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ bucket, limit: rule.limit, windowMs: rule.windowSec * 1000 }),
  }))
  return ((await res.json()) as { allowed?: boolean }).allowed === true
}

/** Hook emails draw on a per-hook hourly budget AND a shared daily one. */
async function emailBudget(env: Env, bucket: string, rule: { limit: number; windowSec: number }): Promise<boolean> {
  return (await allow(env, bucket, rule)) && (await allow(env, 'email:day', LIMITS.hookEmailsPerDay))
}

/** 503 when the hook secret is not configured, 401 when it doesn't match,
    null when the caller really is our database. */
async function hookGuard(request: Request, env: Env): Promise<Response | null> {
  if (!env.SUPABASE_HOOK_SECRET) return json({ ok: false, reason: 'not configured' }, 503)
  const ok = await hookSecretMatches(env.SUPABASE_HOOK_SECRET, request.headers.get(HOOK_SECRET_HEADER))
  return ok ? null : json({ ok: false, reason: 'bad secret' }, 401)
}

const clientIp = (request: Request) => request.headers.get('cf-connecting-ip') ?? 'unknown'

/** Call a public (anon-executable) Supabase RPC. */
async function supabaseRpc<T>(env: Env, fn: string, args: Record<string, unknown>): Promise<T | null> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(args),
  }).catch(() => null)
  if (!res || !res.ok) return null
  return (await res.json()) as T
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

const subKey = async (endpoint: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  return bytesToB64url(new Uint8Array(digest))
}

export class AlertsDO {
  private storage: DOStorage
  private env: Env
  // Cloudflare constructs a Durable Object with (state, env); env was unused
  // until APNs needed the signing key in here.
  constructor(state: DOState, env: Env) {
    this.storage = state.storage
    this.env = env
  }

  /**
   * Deliver one alert to one subscriber, whichever kind it is.
   *
   * Web push is a tickle: the empty POST wakes the service worker, which then
   * fetches the queued payload. Native has no service worker, so APNs must
   * carry the text itself — hence the payload being queued either way but only
   * *read back* by the web path.
   *
   * @returns whether the subscription is gone and should be dropped.
   */
  private async deliver(
    sub: Subscription, keys: VapidKeys, alert: AlertPayload, ttl: string,
  ): Promise<{ ok: boolean; gone: boolean }> {
    const token = apnsDeviceToken(sub.endpoint)
    if (token) {
      const cfg = apnsConfig(this.env)
      // No key configured: a native device simply gets nothing. Never an error
      // — web subscribers must keep working regardless.
      if (!cfg) return { ok: false, gone: false }
      const res = await sendApnsWith(
        fetch as never, cfg, token,
        { title: alert.title, body: alert.body, url: alert.url },
      )
      return { ok: res.ok, gone: res.gone }
    }

    const res = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        Authorization: await vapidAuthHeader(sub.endpoint, keys, VAPID_SUBJECT),
        TTL: ttl,
        Urgency: 'normal',
      },
    }).catch(() => null)
    if (!res) return { ok: false, gone: false }
    return { ok: res.ok, gone: res.status === 404 || res.status === 410 }
  }

  private async vapid(): Promise<VapidKeys> {
    let keys = await this.storage.get<VapidKeys>('vapid')
    if (!keys) {
      keys = await generateVapidKeys()
      await this.storage.put('vapid', keys)
    }
    return keys
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (path === '/vapid') {
      return json({ publicKey: (await this.vapid()).publicKeyB64 })
    }

    // Only the Worker can reach this object, and it sets userId from a
    // verified access token — never from what the client sent.
    if (path === '/subscribe' && request.method === 'POST') {
      const body = (await request.json()) as { endpoint?: string; spotIds?: string[]; userId?: string }
      // A native device token arrives as apns://<token>; web push is https.
      if (typeof body.endpoint !== 'string' || body.endpoint.length > 2048 ||
        !/^(https:\/\/|apns:\/\/)/.test(body.endpoint)) return json({ error: 'bad endpoint' }, 400)
      if (typeof body.userId !== 'string' || !UUID_RE.test(body.userId)) return json({ error: 'no user' }, 400)
      const userId = body.userId
      const spotIds = (Array.isArray(body.spotIds) ? body.spotIds : [])
        .filter((id) => ALL_SPOTS.has(id)).slice(0, MAX_WATCHED)
      const key = await subKey(body.endpoint)

      if (!(await this.storage.get<Subscription>(`sub:${key}`))) {
        const subs = await this.storage.list<Subscription>({ prefix: 'sub:' })
        if (subs.size >= MAX_SUBSCRIPTIONS) return json({ error: 'full' }, 503)
        // Oldest-refreshed first: a reinstall leaves a dead subscription
        // behind, and refusing the new device would lock the user out.
        const mine = [...subs].filter(([, s]) => s.userId === userId && s.verified)
          .sort(([, a], [, b]) => a.createdAt.localeCompare(b.createdAt))
        for (const [staleKey] of mine.slice(0, Math.max(0, mine.length - MAX_SUBS_PER_USER + 1))) {
          await this.storage.delete(staleKey)
          await this.storage.delete(`pending:${staleKey.slice('sub:'.length)}`)
        }
      }

      const sub: Subscription = {
        endpoint: body.endpoint, spotIds, createdAt: new Date().toISOString(), userId, verified: true,
      }
      await this.storage.put(`sub:${key}`, sub)
      return json({ ok: true, watching: spotIds.length })
    }

    if (path === '/ratelimit' && request.method === 'POST') {
      const body = (await request.json()) as { bucket?: string; limit?: number; windowMs?: number }
      if (!body.bucket || typeof body.limit !== 'number' || typeof body.windowMs !== 'number') {
        return json({ error: 'bad payload' }, 400)
      }
      const rlKey = `rl:${body.bucket}`
      const { allowed, next } = take(await this.storage.get<Window>(rlKey), body.limit, body.windowMs, Date.now())
      await this.storage.put(rlKey, next)
      return json({ allowed })
    }

    if (path === '/notify-owner' && request.method === 'POST') {
      const body = (await request.json()) as { ownerId?: string; alert?: AlertPayload }
      if (!body.ownerId || !body.alert?.title) return json({ error: 'bad payload' }, 400)
      const subs = await this.storage.list<Subscription>({ prefix: 'sub:' })
      const keys = await this.vapid()
      let sent = 0
      for (const [storageKey, sub] of subs) {
        if (sub.userId !== body.ownerId || !sub.verified) continue
        const key = storageKey.slice('sub:'.length)
        const pendingKey = `pending:${key}`
        const existing = (await this.storage.get<AlertPayload[]>(pendingKey)) ?? []
        await this.storage.put(pendingKey, [...existing, body.alert].slice(-5))
        const out = await this.deliver(sub, keys, body.alert, '86400')
        if (out.gone) {
          await this.storage.delete(storageKey)
          await this.storage.delete(pendingKey)
        } else if (out.ok) {
          sent++
        }
      }
      return json({ ok: true, sent })
    }

    if (path === '/unsubscribe' && request.method === 'POST') {
      const body = (await request.json()) as { endpoint?: string }
      if (!body.endpoint) return json({ error: 'bad endpoint' }, 400)
      const key = await subKey(body.endpoint)
      await this.storage.delete(`sub:${key}`)
      await this.storage.delete(`pending:${key}`)
      return json({ ok: true })
    }

    if (path === '/pending') {
      const key = url.searchParams.get('k')
      if (!key) return json([], 400)
      const pending = (await this.storage.get<AlertPayload[]>(`pending:${key}`)) ?? []
      await this.storage.delete(`pending:${key}`)
      return json(pending)
    }

    if (path === '/status') {
      const key = url.searchParams.get('k')
      const sub = key ? await this.storage.get<Subscription>(`sub:${key}`) : undefined
      return json({ subscribed: !!sub, watching: sub?.spotIds.length ?? 0 })
    }

    if (path === '/cron' && request.method === 'POST') {
      return json(await this.runDaily())
    }

    return json({ error: 'not found' }, 404)
  }

  /** Score tonight for every watched spot; queue + tickle where it fires. */
  private async runDaily(): Promise<{ checked: number; alerted: number; dropped: number }> {
    // Per-IP buckets would otherwise accumulate forever.
    const nowMs = Date.now()
    for (const [rlKey, w] of await this.storage.list<Window>({ prefix: 'rl:' })) {
      if (expired(w, nowMs)) await this.storage.delete(rlKey)
    }

    const subs = await this.storage.list<Subscription>({ prefix: 'sub:' })
    const keys = await this.vapid()
    const today = new Date()
    const dayTag = today.toISOString().slice(0, 10)
    const skyCache = new Map<string, SkyHourly | null>()
    let checked = 0
    let alerted = 0
    let dropped = 0

    for (const [storageKey, sub] of subs) {
      const key = storageKey.slice('sub:'.length)
      const alerts: AlertPayload[] = []

      for (const spotId of sub.spotIds) {
        const spot = ALL_SPOTS.get(spotId)
        if (!spot) continue
        checked++

        const cacheKey = `${spot.lat},${spot.lng}`
        let sky = skyCache.get(cacheKey)
        if (sky === undefined) {
          sky = await fetchSkyForecast(spot.lat, spot.lng).catch(() => null)
          skyCache.set(cacheKey, sky)
        }
        const wt = windowTimeFor(spot, today, spot.lat, spot.lng)
        const day = scoreBestDay(spot, today, spot.lat, spot.lng, {
          skyScore: sky ? skyScoreAt(sky, wt) : null,
        })
        if (!shouldAlert(day)) continue

        const lastKey = `last:${key}:${spotId}`
        if ((await this.storage.get<string>(lastKey)) === dayTag) continue
        await this.storage.put(lastKey, dayTag)
        alerts.push(alertMessage(spot.name, spot.id, day))
      }

      if (!alerts.length) continue
      const pendingKey = `pending:${key}`
      const existing = (await this.storage.get<AlertPayload[]>(pendingKey)) ?? []
      await this.storage.put(pendingKey, [...existing, ...alerts].slice(-5))

      // Several spots can fire at once. Web push shows them all from the
      // pending queue; APNs carries one payload, so lead with the newest.
      const out = await this.deliver(sub, keys, alerts[alerts.length - 1], '21600')

      if (out.gone) {
        // The browser dropped the subscription, or Apple says the device is
        // unregistered.
        await this.storage.delete(storageKey)
        await this.storage.delete(pendingKey)
        dropped++
      } else if (out.ok) {
        alerted++
      }
    }

    return { checked, alerted, dropped }
  }
}

const doStub = (env: Env) => env.ALERTS.get(env.ALERTS.idFromName('alerts'))

/** The iOS wrapper's page origin — the only cross-origin caller /api/push has. */
const WRAPPER_ORIGIN = 'capacitor://localhost'

/* The DO's other routes (notify-owner, cron, ratelimit) send push to anyone
   and spend quota; they are reachable only from inside this Worker. */
const PUBLIC_PUSH_ROUTES: Record<string, string> = {
  '/vapid': 'GET',
  '/pending': 'GET',
  '/status': 'GET',
  '/subscribe': 'POST',
  '/unsubscribe': 'POST',
}

async function pushRoute(request: Request, url: URL, env: Env): Promise<Response> {
  const inner = url.pathname.slice('/api/push'.length)
  if (PUBLIC_PUSH_ROUTES[inner] !== request.method) return json({ error: 'not found' }, 404)
  const stub = doStub(env)

  if (request.method === 'GET') {
    return stub.fetch(new Request(`https://do${inner}${url.search}`))
  }

  if (inner === '/subscribe') {
    const userId = await requestUser(request, env)
    if (!userId) return json({ error: 'sign in required' }, 401)
    if (!(await allow(env, `sub:${userId}`, LIMITS.subscribePerUser))) return json({ error: 'rate limited' }, 429)
    if (!(await allow(env, `ip:${clientIp(request)}`, LIMITS.pushWritesPerIp))) return json({ error: 'rate limited' }, 429)
    const body = (await request.json().catch(() => null)) as { endpoint?: unknown; spotIds?: unknown } | null
    return stub.fetch(new Request('https://do/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint: body?.endpoint, spotIds: body?.spotIds, userId }),
    }))
  }

  // /unsubscribe: the endpoint is the capability, so no sign-in needed —
  // a signed-out device must still be able to stop its own alerts.
  if (!(await allow(env, `ip:${clientIp(request)}`, LIMITS.pushWritesPerIp))) return json({ error: 'rate limited' }, 429)
  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null
  return stub.fetch(new Request('https://do/unsubscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint: body?.endpoint }),
  }))
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Shortlist unfurl: real path → OG tags → meta-refresh to the hash route.
    const listMatch = /^\/l\/([0-9a-f-]{36})$/i.exec(url.pathname)
    if (listMatch && UUID_RE.test(listMatch[1])) {
      const id = listMatch[1].toLowerCase()
      const rows = await supabaseRpc<Array<{ title: string | null; spots: unknown[] }>>(
        env, 'get_shortlist', { p_id: id },
      )
      const row = rows?.[0]
      if (!row) return env.ASSETS.fetch(request) // unknown id → app's empty state
      return new Response(listOgHtml(id, row.title, Array.isArray(row.spots) ? row.spots.length : 0), {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
      })
    }

    // Supabase DB webhook: a client answered a shortlist → push + email the owner.
    if (url.pathname === '/api/shortlist/response-hook' && request.method === 'POST') {
      const denied = await hookGuard(request, env)
      if (denied) return denied
      const body = (await request.json().catch(() => null)) as
        | { record?: { list_id?: string; client_name?: string | null; picked?: string[]; comment?: string | null } }
        | null
      const listId = body?.record?.list_id
      if (!listId || !UUID_RE.test(listId)) return new Response('bad payload', { status: 400 })
      const owner = await supabaseRpc<string>(env, 'get_list_owner', { p_id: listId })
      if (!owner) return new Response('no owner', { status: 200 })
      // shortlist_responses takes anonymous inserts, so a leaked list link
      // can still drive this hook legitimately; cap what one owner receives.
      if (!(await allow(env, `notify:${owner}`, LIMITS.notifyPerOwner))) {
        return json({ ok: true, sent: 0, emailed: false, limited: true })
      }
      const rows = await supabaseRpc<Array<{ title: string | null }>>(env, 'get_shortlist', { p_id: listId })
      const title = rows?.[0]?.title ?? null
      const who = body?.record?.client_name?.trim()
      const alert = {
        title: who ? `${who} picked their spots` : 'Your client responded',
        body: `New response on “${title ?? 'Location options'}” — open the You tab to see their picks.`,
        url: '/#/you',
      }
      const pushed = await doStub(env).fetch(new Request('https://do/notify-owner', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ownerId: owner, alert }),
      }))

      // Email leg (Resend): the owner-email RPC is gated by a shared secret so
      // holding a list link never exposes the photographer's address.
      let emailed = false
      if (env.RESEND_API_KEY && (await allow(env, 'email:day', LIMITS.hookEmailsPerDay))) {
        const email = await supabaseRpc<string>(env, 'get_owner_email', {
          p_id: listId, p_secret: env.SUPABASE_HOOK_SECRET,
        })
        if (email) {
          const pickedNames = (body?.record?.picked ?? []).map((id) => ALL_SPOTS.get(id)?.name ?? id)
          const msg = responseEmail({
            title, clientName: who ?? null, pickedNames, comment: body?.record?.comment ?? null,
          })
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
            body: JSON.stringify({
              from: 'Vantage <alerts@shootvantage.com>',
              to: [email],
              subject: msg.subject,
              html: msg.html,
            }),
          }).catch(() => null)
          emailed = !!res && res.ok
        }
      }

      const pushResult = (await pushed.json().catch(() => ({}))) as Record<string, unknown>
      return json({ ...pushResult, emailed })
    }

    // Supabase DB webhook: a tester sent feedback → email it. The row in
    // `feedback` is the durable record; this leg just means nobody has to
    // remember to read the table.
    if (url.pathname === '/api/feedback-hook' && request.method === 'POST') {
      const denied = await hookGuard(request, env)
      if (denied) return denied
      const body = (await request.json().catch(() => null)) as
        | { record?: { kind?: string; message?: string; contact_email?: string | null; app_version?: string | null; platform?: string | null } }
        | null
      const r = body?.record
      if (!r?.message) return json({ ok: false, reason: 'no message' }, 400)

      let emailed = false
      if (env.RESEND_API_KEY && (await emailBudget(env, 'email:feedback', LIMITS.feedbackEmails))) {
        const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!))
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            from: 'Vantage <alerts@shootvantage.com>',
            to: ['flahertyjon@gmail.com'],
            // Reply-to only when they left one, so hitting reply reaches the tester.
            ...(r.contact_email ? { reply_to: [r.contact_email] } : {}),
            subject: `Vantage feedback (${r.kind ?? 'bug'}) — ${r.app_version ?? 'unknown build'}`,
            html: `<p><strong>${esc(r.kind ?? 'bug')}</strong> · build ${esc(r.app_version ?? 'unknown')}</p>`
              + `<p style="white-space:pre-wrap">${esc(r.message)}</p>`
              + `<p style="color:#777;font-size:12px">${esc(r.contact_email ?? 'no contact email')}<br>${esc(r.platform ?? '')}</p>`,
          }),
        }).catch(() => null)
        emailed = !!res && res.ok
      }
      return json({ ok: true, emailed })
    }

    // Supabase DB webhook: someone reported a community shot → email it. The
    // guideline the whole feature exists for asks for "timely responses", and
    // a queue nobody is paged about is not timely. Two independent reports
    // already auto-hid the shot server-side by the time this fires.
    if (url.pathname === '/api/report-hook' && request.method === 'POST') {
      const denied = await hookGuard(request, env)
      if (denied) return denied
      const body = (await request.json().catch(() => null)) as
        | { record?: { photo_id?: string; reason?: string; note?: string | null; spot_id?: string | null; path?: string | null; hidden?: boolean } }
        | null
      const r = body?.record
      if (!r?.photo_id) return json({ ok: false, reason: 'no photo' }, 400)

      let emailed = false
      if (env.RESEND_API_KEY && (await emailBudget(env, 'email:report', LIMITS.reportEmails))) {
        const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!))
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            from: 'Vantage <alerts@shootvantage.com>',
            to: ['flahertyjon@gmail.com'],
            subject: `Vantage: shot reported (${r.reason ?? 'unknown'})${r.hidden ? ' — AUTO-HIDDEN' : ''}`,
            html: `<p><strong>${esc(r.reason ?? 'unknown')}</strong>${r.hidden ? ' · <strong>already hidden</strong>' : ' · still visible'}</p>`
              + `<p>Spot: ${esc(r.spot_id ?? '—')}<br>Photo: ${esc(r.photo_id)}</p>`
              + (r.note ? `<p style="white-space:pre-wrap">“${esc(r.note)}”</p>` : '')
              + `<p style="color:#777;font-size:12px">Triage: select * from photo_reports where status='new';</p>`,
          }),
        }).catch(() => null)
        emailed = !!res && res.ok
      }
      return json({ ok: true, emailed })
    }

    // Resend inbound mail: someone emailed support@shootvantage.com (published
    // in-app under guideline 1.2) → forward it to Jon. The webhook carries
    // METADATA ONLY, so the body is fetched from the receiving API by id.
    if (url.pathname === '/api/inbound-mail' && request.method === 'POST') {
      const forwardTo = env.SUPPORT_FORWARD_TO
      if (!env.RESEND_WEBHOOK_SECRET || !env.RESEND_API_KEY || !forwardTo) {
        return json({ ok: false, reason: 'not configured' }, 503)
      }
      // Raw text, never a re-stringified object — that breaks the signature.
      const raw = await request.text()
      const ok = await verifySvixSignature(env.RESEND_WEBHOOK_SECRET, raw, {
        'svix-id': request.headers.get('svix-id'),
        'svix-timestamp': request.headers.get('svix-timestamp'),
        'svix-signature': request.headers.get('svix-signature'),
      })
      if (!ok) return json({ ok: false, reason: 'bad signature' }, 401)

      const event = JSON.parse(raw) as { type?: string }
      if (event.type !== 'email.received') return json({ ok: true, skipped: event.type })
      const id = receivedEmailId(event)
      if (!id) return json({ ok: false, reason: 'no id' }, 400)

      const got = await fetch(`https://api.resend.com/emails/receiving/${id}`, {
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
      }).catch(() => null)
      if (!got || !got.ok) return json({ ok: false, reason: 'fetch failed' }, 502)
      const received = (await got.json()) as ReceivedEmail

      const sent = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify(buildForward(received, forwardTo)),
      }).catch(() => null)
      return json({ ok: !!sent && sent.ok })
    }

    if (url.pathname.startsWith('/api/push/')) {
      // CORS, for exactly one caller: the iOS wrapper, whose pages live on
      // capacitor://localhost and whose WKWebView enforces cross-origin rules.
      // Without these answers a device token can never reach the server —
      // TestFlight build 16's alerts toggle died here. Web callers are
      // same-origin and never notice.
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'access-control-allow-origin': WRAPPER_ORIGIN,
            'access-control-allow-methods': 'GET, POST, OPTIONS',
            'access-control-allow-headers': 'content-type, authorization',
            'access-control-max-age': '86400',
          },
        })
      }
      const res = await pushRoute(request, url, env)
      const out = new Response(res.body, res)
      out.headers.set('access-control-allow-origin', WRAPPER_ORIGIN)
      return out
    }
    return env.ASSETS.fetch(request)
  },

  async scheduled(_controller: unknown, env: Env): Promise<void> {
    await doStub(env).fetch(new Request('https://do/cron', { method: 'POST' }))
  },
}
