import { test, expect } from '@playwright/test'

/*
 * The cheap WebKit gate for the iOS wrapper (backlog J3).
 *
 * The native app serves this exact dist/ bundle inside WKWebView, and Playwright's
 * WebKit is the closest engine we can drive without a Mac. So this catches, on a
 * free Ubuntu runner in about a minute, the failures that otherwise cost a
 * ~10-minute macOS simulator run: white screens, asset 404s (the `base: './'`
 * class of bug), and JS that only breaks in WebKit.
 *
 * It is a PROXY, not a substitute. It knows nothing about the capacitor://
 * scheme, the native bridge, plugins, or real iOS chrome — those stay with
 * .github/workflows/ios-simulator.yml, which now only runs when the native
 * surface actually changes.
 */

const ROUTES: Array<[string, string]> = [
  ['today', '/'],
  ['explore', '/#/explore'],
  ['plan', '/#/plan'],
  ['day', '/#/day'],
  ['you', '/#/you'],
  ['community', '/#/community'],
  ['spot', '/#/spot/curtis-hixon-waterfront-park'],
  ['settings', '/#/settings'],
]

// 1x1 transparent PNG — stands in for hotlinked spot photos.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('iOS wrapper readiness (WebKit)', () => {
  for (const [name, path] of ROUTES) {
    test(`${name} renders clean`, async ({ page, baseURL }) => {
      const origin = baseURL!
      const uncaught: string[] = []
      const badRequests: string[] = []
      const consoleErrors: string[] = []

      page.on('pageerror', (e) => uncaught.push(`${e.name}: ${e.message}`))
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
      page.on('requestfailed', (r) => {
        if (r.url().startsWith(origin)) badRequests.push(`${r.url()} — ${r.failure()?.errorText}`)
      })
      page.on('response', (r) => {
        if (r.url().startsWith(origin) && r.status() >= 400) badRequests.push(`${r.url()} — HTTP ${r.status()}`)
      })

      // Keep the run hermetic and fast: third-party flakiness on a CI runner
      // must never redden the wrapper gate.
      await page.route(/upload\.wikimedia\.org|live\.staticflickr\.com/, (r) =>
        r.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }))
      await page.route(/api\.open-meteo\.com|marine-api\.open-meteo\.com/, (r) =>
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ hourly: {}, daily: {} }) }))

      await page.goto(path)
      await page.waitForLoadState('networkidle').catch(() => {})

      // The five-tab shell mounts on every screen — proves React booted.
      await expect(page.locator('nav.tabbar a')).toHaveCount(5)

      // Not the branded router errorElement.
      await expect(page.getByText('Something went sideways')).toHaveCount(0)

      // Not a white screen: real content, not just the shell.
      const text = (await page.locator('#root').innerText()).trim()
      expect(text.length, `${name} rendered almost no text — likely a blank screen`).toBeGreaterThan(120)

      expect(uncaught, `uncaught JS errors on ${name}`).toEqual([])
      expect(badRequests, `same-origin request failures on ${name}`).toEqual([])

      // Console errors naming a third-party host are environmental (offline CI,
      // blocked analytics); anything else is ours and should fail the gate.
      const ours = consoleErrors.filter((t) => !/https?:\/\//.test(t) || t.includes(origin))
      expect(ours, `console errors on ${name}`).toEqual([])
    })
  }
})
