import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CLIENT_LIST_PATHS } from '../../src/pwa/navigation-denylist'
import { storedShortlistUrl } from '../../src/spots/shortlist'

/* An installed PWA's worker answered /l/<uuid> with the app shell, so a
   client tapping their shortlist link landed on the photographer's home
   screen instead of the list. Workbox matches the denylist against the
   navigation's pathname + search. */

const LIST_ID = '0b9d4c3e-5f1a-4e2b-9c7d-8a6f5e4d3c2b'
const navigation = (url: string) => { const u = new URL(url); return u.pathname + u.search }

describe('service-worker navigation denylist: client lists', () => {
  it('lets the share link through to the network, in every form it arrives', () => {
    const link = storedShortlistUrl(LIST_ID)
    // The Worker's own route is case-insensitive, so the worker must be too.
    const shouted = storedShortlistUrl(LIST_ID.toUpperCase()).replace('/l/', '/L/')
    for (const url of [link, `${link}/`, shouted, `${link}?utm_source=sms`]) {
      expect(CLIENT_LIST_PATHS.test(navigation(url)), url).toBe(true)
    }
  })

  it('never blocks the app shell or look-alike paths', () => {
    for (const path of ['/', '/index.html', '/?source=pwa', '/l', '/list', '/legal', '/api/push/vapid', '/spot-photos/l/a.jpg']) {
      expect(CLIENT_LIST_PATHS.test(path), path).toBe(false)
    }
  })

  it('is wired into the PWA config', () => {
    const config = readFileSync(resolve(__dirname, '../../vite.config.ts'), 'utf8')
    expect(config).toMatch(/navigateFallbackDenylist: \[[^\]]*\bCLIENT_LIST_PATHS\b[^\]]*\]/)
  })
})
