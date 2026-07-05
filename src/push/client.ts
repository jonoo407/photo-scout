import { b64urlToBytes } from './vapid'

/* Browser side of conditions alerts: permission, push subscription, and
   keeping the server's watch list in step with the user's saved spots. */

export function pushSupported(): boolean {
  return typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof globalThis.PushManager !== 'undefined' &&
    typeof globalThis.Notification !== 'undefined'
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

async function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** True once alerts are on: permission granted + push subscription live. */
export async function alertsEnabled(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== 'granted') return false
  return (await currentSubscription()) !== null
}

/**
 * Turn alerts on: ask permission, subscribe with the server's VAPID key, and
 * register which spots to watch. Returns false when the user declines or the
 * environment can't push.
 */
export async function enableConditionAlerts(spotIds: string[], userId?: string | null): Promise<boolean> {
  if (!pushSupported()) return false
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    const { publicKey } = (await (await fetch('/api/push/vapid')).json()) as { publicKey: string }
    const raw = b64urlToBytes(publicKey)
    const applicationServerKey = new ArrayBuffer(raw.length)
    new Uint8Array(applicationServerKey).set(raw)
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
  }
  const res = await postJson('/api/push/subscribe', { endpoint: sub.endpoint, spotIds, userId: userId ?? null })
  return res.ok
}

/** Turn alerts off on both sides. */
export async function disableConditionAlerts(): Promise<void> {
  if (!pushSupported()) return
  const sub = await currentSubscription()
  if (!sub) return
  const endpoint = sub.endpoint
  await sub.unsubscribe()
  await postJson('/api/push/unsubscribe', { endpoint }).catch(() => {})
}

/** Keep the server's watch list current — no-op unless already subscribed. */
export async function syncWatchedSpots(spotIds: string[], userId?: string | null): Promise<void> {
  if (!pushSupported() || Notification.permission !== 'granted') return
  const sub = await currentSubscription()
  if (!sub) return
  await postJson('/api/push/subscribe', { endpoint: sub.endpoint, spotIds, userId: userId ?? null }).catch(() => {})
}
