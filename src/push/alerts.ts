/* One switch over two delivery systems (J3 phase 4, 2026-07-29).

   Web push and Apple Push Notification service (APNs) differ completely below
   this line — one is a service-worker tickle, the other a signed payload — but
   nothing above it should care. Settings shows one toggle; the watch-list sync
   calls one function.

   Before this existed, `pushSupported()` was false inside the wrapper (no
   service worker, no PushManager) and Settings rendered "not supported here",
   so notifications were unreachable on iOS with no way to even ask. */
import {
  pushSupported, alertsEnabled, enableConditionAlerts, disableConditionAlerts,
  syncWatchedSpots,
} from './client'
import {
  nativePushAvailable, enableNativePush, disableNativePush, syncNativeWatch,
  storedApnsToken,
} from './native-push'

export function alertsSupported(): boolean {
  return nativePushAvailable() || pushSupported()
}

/** Whether alerts are currently on. Native has no PushManager to ask, so the
    stored device token is the record of having registered. */
export async function alertsAreOn(): Promise<boolean> {
  if (nativePushAvailable()) return storedApnsToken() !== null
  return alertsEnabled()
}

export interface EnableAlertsResult {
  on: boolean
  /** True only for a REAL permission denial — the one failure the user can fix
      in Settings. Everything else (no token, unreachable server) must not be
      blamed on permissions; build 16 did, and it sent the user to an iOS
      Settings screen where everything was already allowed. */
  blocked: boolean
}

export async function enableAlerts(spotIds: string[], userId: string | null): Promise<EnableAlertsResult> {
  if (nativePushAvailable()) {
    const outcome = await enableNativePush(spotIds, userId)
    return { on: outcome === 'on', blocked: outcome === 'denied' }
  }
  const on = await enableConditionAlerts(spotIds, userId)
  const blocked = !on &&
    typeof Notification !== 'undefined' && Notification.permission === 'denied'
  return { on, blocked }
}

export async function disableAlerts(): Promise<void> {
  if (nativePushAvailable()) return disableNativePush()
  return disableConditionAlerts()
}

export async function syncWatch(spotIds: string[], userId: string | null): Promise<void> {
  if (nativePushAvailable()) return syncNativeWatch(spotIds, userId)
  return syncWatchedSpots(spotIds, userId)
}
