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

export async function enableAlerts(spotIds: string[], userId: string | null): Promise<boolean> {
  return nativePushAvailable()
    ? enableNativePush(spotIds, userId)
    : enableConditionAlerts(spotIds, userId)
}

export async function disableAlerts(): Promise<void> {
  if (nativePushAvailable()) return disableNativePush()
  return disableConditionAlerts()
}

export async function syncWatch(spotIds: string[], userId: string | null): Promise<void> {
  if (nativePushAvailable()) return syncNativeWatch(spotIds, userId)
  return syncWatchedSpots(spotIds, userId)
}
