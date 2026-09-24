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
  storedApnsToken, type NativeEnableOutcome,
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

/** Why turning alerts on failed, in the terms the user can act on.

    - `blocked`: a REAL permission denial — the one failure fixable in
      Settings. Nothing else may be blamed on permissions; build 16 did, and
      sent the user to an iOS Settings screen where everything was allowed.
    - `registration`: iOS never handed over a device token (Apple errored or
      went silent), so there was nothing to send the server.
    - `network`: the alert server didn't accept the subscription. */
export type EnableAlertsFailure = 'blocked' | 'registration' | 'network'

export interface EnableAlertsResult {
  on: boolean
  failure: EnableAlertsFailure | null
}

const NATIVE_FAILURE: Record<Exclude<NativeEnableOutcome, 'on'>, EnableAlertsFailure> = {
  denied: 'blocked',
  'register-failed': 'registration',
  'no-token': 'registration',
  'post-failed': 'network',
  unsupported: 'network',
}

export async function enableAlerts(spotIds: string[], userId: string | null): Promise<EnableAlertsResult> {
  if (nativePushAvailable()) {
    const outcome = await enableNativePush(spotIds, userId)
    return outcome === 'on' ? { on: true, failure: null } : { on: false, failure: NATIVE_FAILURE[outcome] }
  }
  const on = await enableConditionAlerts(spotIds, userId)
  if (on) return { on, failure: null }
  const blocked = typeof Notification !== 'undefined' && Notification.permission === 'denied'
  return { on, failure: blocked ? 'blocked' : 'network' }
}

export async function disableAlerts(): Promise<void> {
  if (nativePushAvailable()) return disableNativePush()
  return disableConditionAlerts()
}

export async function syncWatch(spotIds: string[], userId: string | null): Promise<void> {
  if (nativePushAvailable()) return syncNativeWatch(spotIds, userId)
  return syncWatchedSpots(spotIds, userId)
}
