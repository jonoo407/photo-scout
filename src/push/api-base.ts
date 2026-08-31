import { isNativeApp } from '../pwa/native'

/* Worker API endpoints (/api/…) are served by shootvantage.com. On the web the
   page IS shootvantage.com, so relative paths work. Inside the Capacitor
   wrapper the page's origin is capacitor://localhost — a relative fetch
   resolves to a URL nothing serves, and fails after the user already granted
   whatever permission the feature asked for. Same works-on-web/dead-in-wrapper
   class as the WKWebView geolocation bug (src/geo/position.ts).

   The host is hardcoded on purpose, matching LIST_BASE in src/spots/shortlist.ts:
   the binary ships pointing at production, and a build-time origin would be one
   more value the iOS release workflow could silently drop (build 15's missing
   Supabase vars). */

export const API_ORIGIN = 'https://shootvantage.com'

/** Resolve an /api path for the current platform. */
export function apiUrl(path: string, native: boolean = isNativeApp()): string {
  return native ? `${API_ORIGIN}${path}` : path
}
