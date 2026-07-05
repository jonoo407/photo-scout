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
import type { Spot } from '../src/spots/types'

const ALL_SPOTS = new Map<string, Spot>([...TAMPA, ...PHILLY].map((s) => [s.id, s]))
const VAPID_SUBJECT = 'mailto:alerts@shootvantage.com'
const MAX_WATCHED = 20
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Subscription {
  endpoint: string
  spotIds: string[]
  createdAt: string
  /** Supabase auth user id when the subscriber was signed in — routes
      client-response notifications to the right device. */
  userId?: string | null
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
}

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
  constructor(state: DOState) {
    this.storage = state.storage
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

    if (path === '/subscribe' && request.method === 'POST') {
      const body = (await request.json()) as { endpoint?: string; spotIds?: string[]; userId?: string | null }
      if (!body.endpoint || !/^https:\/\//.test(body.endpoint)) return json({ error: 'bad endpoint' }, 400)
      const spotIds = (body.spotIds ?? []).filter((id) => ALL_SPOTS.has(id)).slice(0, MAX_WATCHED)
      const key = await subKey(body.endpoint)
      const userId = typeof body.userId === 'string' && UUID_RE.test(body.userId) ? body.userId : null
      const sub: Subscription = { endpoint: body.endpoint, spotIds, createdAt: new Date().toISOString(), userId }
      await this.storage.put(`sub:${key}`, sub)
      return json({ ok: true, watching: spotIds.length })
    }

    if (path === '/notify-owner' && request.method === 'POST') {
      const body = (await request.json()) as { ownerId?: string; alert?: AlertPayload }
      if (!body.ownerId || !body.alert?.title) return json({ error: 'bad payload' }, 400)
      const subs = await this.storage.list<Subscription>({ prefix: 'sub:' })
      const keys = await this.vapid()
      let sent = 0
      for (const [storageKey, sub] of subs) {
        if (sub.userId !== body.ownerId) continue
        const key = storageKey.slice('sub:'.length)
        const pendingKey = `pending:${key}`
        const existing = (await this.storage.get<AlertPayload[]>(pendingKey)) ?? []
        await this.storage.put(pendingKey, [...existing, body.alert].slice(-5))
        const res = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            Authorization: await vapidAuthHeader(sub.endpoint, keys, VAPID_SUBJECT),
            TTL: '86400',
            Urgency: 'normal',
          },
        }).catch(() => null)
        if (res && (res.status === 404 || res.status === 410)) {
          await this.storage.delete(storageKey)
          await this.storage.delete(pendingKey)
        } else if (res && res.ok) {
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

      const res = await fetch(sub.endpoint, {
        method: 'POST',
        headers: {
          Authorization: await vapidAuthHeader(sub.endpoint, keys, VAPID_SUBJECT),
          TTL: '21600',
          Urgency: 'normal',
        },
      }).catch(() => null)

      if (res && (res.status === 404 || res.status === 410)) {
        // Endpoint is gone — the browser dropped the subscription.
        await this.storage.delete(storageKey)
        await this.storage.delete(pendingKey)
        dropped++
      } else if (res && res.ok) {
        alerted++
      }
    }

    return { checked, alerted, dropped }
  }
}

const doStub = (env: Env) => env.ALERTS.get(env.ALERTS.idFromName('alerts'))

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

    // Supabase DB webhook: a client answered a shortlist → push the owner.
    if (url.pathname === '/api/shortlist/response-hook' && request.method === 'POST') {
      const body = (await request.json().catch(() => null)) as
        | { record?: { list_id?: string; client_name?: string | null } }
        | null
      const listId = body?.record?.list_id
      if (!listId || !UUID_RE.test(listId)) return new Response('bad payload', { status: 400 })
      const owner = await supabaseRpc<string>(env, 'get_list_owner', { p_id: listId })
      if (!owner) return new Response('no owner', { status: 200 })
      const rows = await supabaseRpc<Array<{ title: string | null }>>(env, 'get_shortlist', { p_id: listId })
      const who = body?.record?.client_name?.trim()
      const alert = {
        title: who ? `${who} picked their spots` : 'Your client responded',
        body: `New response on “${rows?.[0]?.title ?? 'Location options'}” — open Saved to see their picks.`,
        url: '/#/saved',
      }
      return doStub(env).fetch(new Request('https://do/notify-owner', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ownerId: owner, alert }),
      }))
    }

    if (url.pathname.startsWith('/api/push/')) {
      const inner = url.pathname.slice('/api/push'.length) + url.search
      return doStub(env).fetch(new Request(`https://do${inner}`, request))
    }
    return env.ASSETS.fetch(request)
  },

  async scheduled(_controller: unknown, env: Env): Promise<void> {
    await doStub(env).fetch(new Request('https://do/cron', { method: 'POST' }))
  },
}
