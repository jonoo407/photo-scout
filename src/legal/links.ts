import { API_ORIGIN } from '../push/api-base'
import { isNativeApp } from '../pwa/native'
import { SITE_PAGES, type SitePage } from './pages'

/** Link target for a site page. The wrapper's origin is capacitor://localhost,
    where these paths would load the bundled copy with no way back into the
    app, so native links go to the live site, which Capacitor opens in Safari. */
export function sitePageUrl(page: SitePage, native: boolean = isNativeApp()): string {
  return native ? `${API_ORIGIN}${SITE_PAGES[page]}` : SITE_PAGES[page]
}
