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
import type { Spot } from '../src/spots/types'

const ALL_SPOTS = new Map<string, Spot>([...TAMPA, ...PHILLY].map((s) => [s.id, s]))
const VAPID_SUBJECT = 'mailto:alerts@shootvantage.com'
const MAX_WATCHED = 20

interface Subscription {
  endpoint: string
  spotIds: string[]
  createdAt: string
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
      const body = (await request.json()) as { endpoint?: string; spotIds?: string[] }
      if (!body.endpoint || !/^https:\/\//.test(body.endpoint)) return json({ error: 'bad endpoint' }, 400)
      const spotIds = (body.spotIds ?? []).filter((id) => ALL_SPOTS.has(id)).slice(0, MAX_WATCHED)
      const key = await subKey(body.endpoint)
      const sub: Subscription = { endpoint: body.endpoint, spotIds, createdAt: new Date().toISOString() }
      await this.storage.put(`sub:${key}`, sub)
      return json({ ok: true, watching: spotIds.length })
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
