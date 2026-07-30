/* Service-worker policy for the Capacitor wrapper (J3).
 *
 * On the web the worker is load-bearing: it precaches the bundle, caches spot
 * photos for spotty signal in the field, and drives the self-update lifecycle
 * that fixed the 2026-07-16 stale-session incident.
 *
 * Inside the native app it is all downside:
 *   - the bundle already ships on disk in the IPA, so precaching is redundant
 *   - updates arrive via TestFlight/App Store, and a precache that survives a
 *     binary update can serve the PREVIOUS build's assets indefinitely
 *   - every cross-origin photo fetch under capacitor://localhost is OPAQUE
 *     (status 0), which the CacheFirst rule happily caches — so one failed
 *     image request is cached as if valid and served forever. That is the
 *     missing-thumbnails bug on TestFlight build 3.
 */

import { Capacitor } from '@capacitor/core'

/** Are we inside the iOS wrapper right now? Live check for UI branches. */
export const isNativeApp = (): boolean => Capacitor.isNativePlatform()

export interface PlatformInfo {
  isNative: boolean
}

/** The web keeps its worker; the wrapper never registers one. */
export function shouldRegisterServiceWorker(platform: PlatformInfo): boolean {
  return !platform.isNative
}

export interface PurgeResult {
  unregistered: number
  cachesDeleted: number
}

/**
 * Tear down any worker a previous build installed, and drop its caches.
 *
 * Necessary because skipping registration only helps fresh installs — devices
 * that ran build 3 already have a worker controlling capacitor://localhost,
 * and it would keep serving its poisoned photo cache after an update.
 */
export async function purgeServiceWorkers(
  nav: Navigator,
  cacheStore: CacheStorage | undefined,
): Promise<PurgeResult> {
  let unregistered = 0
  let cachesDeleted = 0

  try {
    if (nav?.serviceWorker?.getRegistrations) {
      const registrations = await nav.serviceWorker.getRegistrations()
      for (const reg of registrations) {
        if (await reg.unregister()) unregistered++
      }
    }
  } catch { /* nothing we can do; never block boot on cleanup */ }

  try {
    if (cacheStore?.keys) {
      for (const key of await cacheStore.keys()) {
        if (await cacheStore.delete(key)) cachesDeleted++
      }
    }
  } catch { /* ditto */ }

  return { unregistered, cachesDeleted }
}
