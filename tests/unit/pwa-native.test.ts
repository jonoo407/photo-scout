import { describe, it, expect, vi } from 'vitest'
import { shouldRegisterServiceWorker, purgeServiceWorkers } from '../../src/pwa/native'

/*
 * Inside the Capacitor wrapper a service worker is all cost and no benefit:
 * the bundle already ships on disk in the IPA, updates arrive through the App
 * Store rather than through a worker, and the CacheFirst photo rule caches
 * OPAQUE (status 0) cross-origin responses under capacitor://localhost — so a
 * failed image fetch gets cached as if valid and is served forever. That is the
 * missing-thumbnails bug seen on TestFlight build 3, which Safari and Chrome
 * never showed because they have their own separate registrations.
 *
 * Skipping registration is not enough on its own: build 3 already installed a
 * worker on real devices, so the native path has to actively tear it down.
 */
describe('service worker on native', () => {
  it('does not register inside the Capacitor wrapper', () => {
    expect(shouldRegisterServiceWorker({ isNative: true })).toBe(false)
  })

  it('still registers on the web, where the PWA update lifecycle depends on it', () => {
    expect(shouldRegisterServiceWorker({ isNative: false })).toBe(true)
  })

  it('unregisters existing workers and deletes their caches', async () => {
    const unregister = vi.fn(async () => true)
    const nav = { serviceWorker: { getRegistrations: async () => [{ unregister }, { unregister }] } }
    const cacheStore = { keys: async () => ['workbox-precache', 'spot-photos'], delete: vi.fn(async () => true) }

    const res = await purgeServiceWorkers(nav as never, cacheStore as never)

    expect(unregister).toHaveBeenCalledTimes(2)
    expect(cacheStore.delete).toHaveBeenCalledTimes(2)
    expect(res).toEqual({ unregistered: 2, cachesDeleted: 2 })
  })

  it('is a no-op where service workers or CacheStorage are unavailable', async () => {
    expect(await purgeServiceWorkers({} as never, undefined)).toEqual({ unregistered: 0, cachesDeleted: 0 })
  })
})
