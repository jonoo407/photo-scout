import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { SITE_PAGES, SITE_PAGE_PATHS, type SitePage } from '../../src/legal/pages'
import { sitePageUrl } from '../../src/legal/links'
import { POSTING_RULES, SUPPORT_EMAIL } from '../../src/community/standards'

/* /privacy and /support used to fall through to the SPA shell, which App
   Review treats as "no privacy policy" (guideline 5.1.1(i)). They are real
   files now, and these guards keep them real: loadable without the bundle or
   the sign-in gate, pointing at each other, and naming every processor the
   app actually talks to. */

const PUBLIC = resolve(__dirname, '../../public')
const pages = Object.keys(SITE_PAGES) as SitePage[]
const read = (name: string) => readFileSync(resolve(PUBLIC, name), 'utf8')

describe.each(pages)('public/%s.html', (page) => {
  const file = `${page}.html`

  it('exists as a standalone document, not the app shell', () => {
    expect(existsSync(resolve(PUBLIC, file))).toBe(true)
    const html = read(file)
    expect(html).toMatch(/^<!doctype html>/i)
    expect(html).not.toContain('id="root"')
    expect(html).not.toMatch(/<script\b/i)
    expect(html.match(/<h1\b/g)).toHaveLength(1)
  })

  it('declares its production URL as canonical', () => {
    expect(read(file)).toContain(`<link rel="canonical" href="https://shootvantage.com${SITE_PAGES[page]}" />`)
  })

  it('links to the other site pages, the app, and support email', () => {
    const html = read(file)
    for (const other of pages) expect(html).toContain(`href="${SITE_PAGES[other]}"`)
    expect(html).toContain('href="/"')
    expect(html).toContain(SUPPORT_EMAIL)
  })

  it('loads nothing from a third party', () => {
    const html = read(file)
    const subresources = [...html.matchAll(/<(?:link|img|script)\b[^>]*(?:href|src)="([^"]+)"/g)]
      .filter(([tag]) => !/rel="canonical"/.test(tag))
      .map(([, url]) => url)
    expect(subresources.length).toBeGreaterThan(0)
    for (const url of subresources) expect(url).toMatch(/^\//)
  })

  it('leaves pinch-zoom alone', () => {
    expect(read(file)).not.toMatch(/user-scalable=no|maximum-scale/)
  })

  it('ships no unfilled placeholders', () => {
    const html = read(file)
    expect(html).not.toMatch(/\bTODO\b/)
    expect(html).not.toContain('class="todo"')
  })
})

describe('policy content tracks the app', () => {
  it('names every service the app sends personal data to', () => {
    const html = read('privacy.html')
    for (const name of ['Supabase', 'Cloudflare', 'Resend', 'Google', 'Apple', 'OpenStreetMap', 'Open-Meteo']) {
      expect(html, name).toContain(name)
    }
  })

  it('states the community rules exactly as the app shows them', () => {
    const terms = read('terms.html').replace(/\s+/g, ' ')
    for (const rule of POSTING_RULES) expect(terms).toContain(rule)
  })
})

describe('crawlability', () => {
  it('robots.txt allows the site and points at the sitemap', () => {
    const robots = read('robots.txt')
    expect(robots).toMatch(/^User-agent: \*$/m)
    expect(robots).not.toMatch(/^Disallow: \/$/m)
    expect(robots).toContain('Sitemap: https://shootvantage.com/sitemap.xml')
  })

  it('the sitemap lists every site page by its canonical URL', () => {
    const sitemap = read('sitemap.xml')
    for (const path of Object.values(SITE_PAGES)) {
      expect(sitemap).toContain(`<loc>https://shootvantage.com${path}</loc>`)
    }
  })
})

describe('service-worker navigation denylist', () => {
  it('covers every form Cloudflare serves a page under', () => {
    for (const path of Object.values(SITE_PAGES)) {
      expect(SITE_PAGE_PATHS.test(path)).toBe(true)
      expect(SITE_PAGE_PATHS.test(`${path}/`)).toBe(true)
      expect(SITE_PAGE_PATHS.test(`${path}.html`)).toBe(true)
    }
  })

  it('never blocks the app shell itself', () => {
    for (const path of ['/', '/index.html', '/privacy-thing', '/l/abc', '/api/push/vapid']) {
      expect(SITE_PAGE_PATHS.test(path), path).toBe(false)
    }
  })

  it('is wired into the PWA config', () => {
    const config = readFileSync(resolve(__dirname, '../../vite.config.ts'), 'utf8')
    expect(config).toMatch(/navigateFallbackDenylist: \[[^\]]*\bSITE_PAGE_PATHS\b[^\]]*\]/)
  })
})

describe('sitePageUrl', () => {
  it('is a same-origin path on the web', () => {
    expect(sitePageUrl('privacy', false)).toBe('/privacy')
  })

  it('goes to the live site inside the wrapper', () => {
    expect(sitePageUrl('support', true)).toBe('https://shootvantage.com/support')
  })
})
