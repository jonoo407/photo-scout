/* One-shot device location, on whichever platform we're running.
 *
 * WKWebView does not implement the HTML5 Geolocation API. `navigator.geolocation`
 * is PRESENT — so every feature-detect passes — but getCurrentPosition invokes
 * neither callback, and the UI spins forever (TestFlight build 8, "Detecting…").
 * Info.plist usage strings are required but don't fix it: CI still reported
 * geolocation=timeout with them in place and permission pre-granted.
 *
 * Native therefore goes through @capacitor/geolocation (CoreLocation); web keeps
 * navigator.geolocation. Every path here rejects on a timer rather than hanging,
 * because a spinner with no end is the worst of the available failures. */
import { Capacitor } from '@capacitor/core'
import { Geolocation as NativeGeolocation } from '@capacitor/geolocation'

export interface Position { lat: number; lng: number }

export interface GeoDeps {
  isNative: boolean
  nativeGet: () => Promise<{ coords: { latitude: number; longitude: number } }>
  webGeo: Geolocation | undefined
}

const WEB_TIMEOUT_MS = 10000

export async function getPositionWith(deps: GeoDeps, timeoutMs = WEB_TIMEOUT_MS): Promise<Position> {
  if (deps.isNative) {
    try {
      const p = await deps.nativeGet()
      return { lat: p.coords.latitude, lng: p.coords.longitude }
    } catch (e) {
      const msg = String((e as Error)?.message ?? e)
      throw new Error(
        /denied|permission/i.test(msg)
          ? 'Location permission is needed — enable it for Vantage in iOS Settings.'
          : 'Could not get your location — try again outside.',
      )
    }
  }

  const geo = deps.webGeo
  if (!geo?.getCurrentPosition) throw new Error('Location is not available on this device.')

  return new Promise<Position>((resolve, reject) => {
    // Belt and braces: browsers honour the options timeout, but a webview that
    // silently drops the request would otherwise leave this pending forever.
    const timer = setTimeout(() => reject(new Error('Location timed out — try again.')), timeoutMs)
    const done = (fn: () => void) => { clearTimeout(timer); fn() }
    geo.getCurrentPosition(
      (p) => done(() => resolve({ lat: p.coords.latitude, lng: p.coords.longitude })),
      (err) => done(() => reject(new Error(
        err?.code === err?.PERMISSION_DENIED
          ? 'Location permission is needed to find spots near you.'
          : 'Could not get your location — try again outside.',
      ))),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 },
    )
  })
}

/** Real wiring. Call sites use this; tests use getPositionWith. */
export function getPosition(timeoutMs?: number): Promise<Position> {
  return getPositionWith({
    isNative: Capacitor.isNativePlatform(),
    nativeGet: () => NativeGeolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000 }),
    webGeo: typeof navigator !== 'undefined' ? navigator.geolocation : undefined,
  }, timeoutMs)
}
