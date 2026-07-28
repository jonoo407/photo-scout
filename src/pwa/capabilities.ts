/* Boot-time capability probe for the native wrapper.
 *
 * WKWebView fails differently from a browser, and screenshots can't see the
 * difference: TestFlight build 8 rendered perfectly while geolocation hung
 * forever, because iOS with a missing usage string calls NEITHER the success
 * nor the error callback. Silence, not failure.
 *
 * So the app reports what actually works, in one greppable line that
 * .github/workflows/ios-simulator.yml asserts on. */

export type GeoState = 'ok' | 'error' | 'timeout' | 'absent'

export interface CapabilityReport {
  geolocation: GeoState
  share: boolean
  clipboard: boolean
  notification: boolean
  push: boolean
}

export async function probeCapabilities(
  nav: Navigator,
  win: Window,
  timeoutMs = 8000,
): Promise<CapabilityReport> {
  const geolocation = await new Promise<GeoState>((resolve) => {
    if (!nav?.geolocation?.getCurrentPosition) return resolve('absent')
    // The timeout is the whole point — a missing NSLocation*UsageDescription
    // produces no callback at all, so only a clock can detect it.
    const timer = setTimeout(() => resolve('timeout'), timeoutMs)
    const settle = (s: GeoState) => { clearTimeout(timer); resolve(s) }
    try {
      nav.geolocation.getCurrentPosition(() => settle('ok'), () => settle('error'))
    } catch { settle('error') }
  })

  return {
    geolocation,
    share: typeof nav?.share === 'function',
    clipboard: typeof nav?.clipboard?.writeText === 'function',
    // Cast: these are probed on a possibly-non-browser window (and on fakes in
    // the unit tests), so lib.dom's guarantees don't apply.
    notification: typeof (win as { Notification?: unknown })?.Notification !== 'undefined',
    push: typeof (win as { PushManager?: unknown })?.PushManager !== 'undefined',
  }
}

export function formatCapabilities(r: CapabilityReport): string {
  const yn = (b: boolean) => (b ? 'yes' : 'no')
  return `[caps] geolocation=${r.geolocation} share=${yn(r.share)} clipboard=${yn(r.clipboard)} notification=${yn(r.notification)} push=${yn(r.push)}`
}
