/* Standalone pages served from public/<name>.html — outside the hash router
   and the sign-in gate, so App Review and crawlers can load them. These
   exact URLs are what App Store Connect points at.

   No imports: vite.config.ts reads this to keep the service worker's
   navigation fallback off these paths. */
export const SITE_PAGES = {
  privacy: '/privacy',
  terms: '/terms',
  support: '/support',
} as const

export type SitePage = keyof typeof SITE_PAGES

/** Every URL form Cloudflare may serve a site page under (/privacy,
    /privacy/, /privacy.html). The app is hash-routed, so none of these may
    ever be answered with the app shell. */
export const SITE_PAGE_PATHS = new RegExp(
  `^/(${Object.keys(SITE_PAGES).join('|')})(\\.html)?/?$`,
)
