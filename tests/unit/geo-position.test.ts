import { describe, it, expect, vi } from 'vitest'
import { getPositionWith } from '../../src/geo/position'

/*
 * WKWebView does not implement the HTML5 Geolocation API. `navigator.geolocation`
 * exists, so every feature-detect passes, but getCurrentPosition calls back
 * NEITHER handler — the app just spins ("Detecting…" on TestFlight build 8).
 * Info.plist usage strings are necessary but not sufficient: the CI capability
 * probe still reported geolocation=timeout with them present AND permission
 * pre-granted.
 *
 * So native goes through @capacitor/geolocation (CoreLocation) and web keeps
 * navigator.geolocation. Both are exercised here because the failure was
 * platform-specific and invisible to the web path.
 */
const webGeo = (impl: 'ok' | 'error' | 'silent') => ({
  getCurrentPosition: (ok: (p: unknown) => void, err: (e: unknown) => void) => {
    if (impl === 'ok') ok({ coords: { latitude: 1, longitude: 2 } })
    if (impl === 'error') err({ code: 1, PERMISSION_DENIED: 1 })
  },
}) as unknown as Geolocation

describe('getPositionWith', () => {
  it('uses the native plugin on iOS, not navigator.geolocation', async () => {
    const nativeGet = vi.fn(async () => ({ coords: { latitude: 27.9, longitude: -82.4 } }))
    const web = webGeo('ok')
    const spy = vi.spyOn(web, 'getCurrentPosition')

    await expect(getPositionWith({ isNative: true, nativeGet, webGeo: web }))
      .resolves.toEqual({ lat: 27.9, lng: -82.4 })
    expect(nativeGet).toHaveBeenCalledOnce()
    expect(spy).not.toHaveBeenCalled()
  })

  it('uses navigator.geolocation on the web', async () => {
    const nativeGet = vi.fn()
    await expect(getPositionWith({ isNative: false, nativeGet, webGeo: webGeo('ok') }))
      .resolves.toEqual({ lat: 1, lng: 2 })
    expect(nativeGet).not.toHaveBeenCalled()
  })

  it('surfaces a permission message when the native plugin refuses', async () => {
    const nativeGet = vi.fn(async () => { throw new Error('User denied location permission') })
    await expect(getPositionWith({ isNative: true, nativeGet, webGeo: undefined }))
      .rejects.toThrow(/permission/i)
  })

  it('rejects rather than hanging when the web API is missing', async () => {
    await expect(getPositionWith({ isNative: false, nativeGet: vi.fn(), webGeo: undefined }))
      .rejects.toThrow(/not available/i)
  })

  it('rejects rather than hanging when the web API never calls back', async () => {
    await expect(getPositionWith({ isNative: false, nativeGet: vi.fn(), webGeo: webGeo('silent') }, 20))
      .rejects.toThrow(/timed out|could not/i)
  })
})
