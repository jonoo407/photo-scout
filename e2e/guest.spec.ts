import { existsSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { stubSupabase, E2E_USER } from './supabase-stub'

/*
 * The signed-out experience, against a build with auth ON (G1).
 *
 * Production is built with the Supabase settings; `npm run build` is not. So
 * every other e2e project runs a bundle where auth is off and the sign-in UI
 * never exists — which is how a sign-in wall in front of all content shipped
 * with CI green. This suite runs the e2e-auth build (`npm run build:e2e-auth`,
 * served from dist-e2e-auth/ on :4174) with Supabase stubbed, and checks what
 * a stranger opening a shared link actually gets: content first, and a sign-in
 * sheet only at the actions that need an account.
 *
 * WebKit, the closest engine to the iOS wrapper's WKWebView.
 */

test.beforeAll(() => {
  if (!existsSync(new URL('../dist-e2e-auth/index.html', import.meta.url))) {
    throw new Error('dist-e2e-auth/ is missing — run `npm run build:e2e-auth` before the guest suite')
  }
})

const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

const SPOT = 'bayshore-boulevard'
const SPOT_NAME = 'Bayshore Boulevard'

let supabaseCalls: string[] = []

async function hermetic(page: Page, origin: string) {
  await page.route(/upload\.wikimedia\.org|live\.staticflickr\.com|tile\.openstreetmap\.org/, (r) =>
    r.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }))
  await page.route(/api\.open-meteo\.com|marine-api\.open-meteo\.com/, (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ hourly: {}, daily: {} }) }))
  supabaseCalls = await stubSupabase(page, origin)
}

test.beforeEach(async ({ page, baseURL }) => {
  await hermetic(page, baseURL!)
})

const signInWall = (page: Page) => page.getByRole('heading', { name: /know where the light is/i })
const sheet = (page: Page) => page.getByRole('dialog')

test.describe('guests browse everything', () => {
  const ROUTES: Array<[string, string]> = [
    ['today', '/'],
    ['explore', '/#/explore'],
    ['map', '/#/explore?view=map'],
    ['plan', '/#/plan'],
    ['day', '/#/day'],
    ['you', '/#/you'],
    ['community', '/#/community'],
    ['hunts', '/#/hunts'],
    ['spot', `/#/spot/${SPOT}`],
    ['settings', '/#/settings'],
  ]

  for (const [name, path] of ROUTES) {
    test(`${name} renders for a signed-out visitor`, async ({ page }) => {
      const uncaught: string[] = []
      page.on('pageerror', (e) => uncaught.push(`${e.name}: ${e.message}`))

      await page.goto(path)
      await expect(page.locator('nav.tabbar a')).toHaveCount(5)
      await expect(signInWall(page)).toHaveCount(0)
      await expect(sheet(page)).toHaveCount(0)
      await expect(page.getByText('Something went sideways')).toHaveCount(0)
      const text = (await page.locator('#root').innerText()).trim()
      expect(text.length, `${name} rendered almost no text`).toBeGreaterThan(120)
      expect(uncaught, `uncaught JS errors on ${name}`).toEqual([])
    })
  }

  test('a shared spot link opens the full spot guide', async ({ page }) => {
    await page.goto(`/#/spot/${SPOT}`)
    await expect(page.getByRole('heading', { name: SPOT_NAME })).toBeVisible()
    await expect(page.getByText("Today's light here")).toBeVisible()
    await expect(page.getByText('How to shoot it')).toBeVisible()
    await expect(page.getByRole('link', { name: /directions to spot/i })).toBeVisible()
  })

  test('a shared day-plan link opens the plan', async ({ page }) => {
    await page.goto(`/#/day?date=2026-10-03&stops=sunrise:${SPOT},sunset:fort-de-soto-park`)
    await expect(page.getByText(SPOT_NAME).first()).toBeVisible()
    await expect(page.getByText('Fort De Soto Park').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /share plan/i })).toBeVisible()
  })

  test('the map draws for a guest', async ({ page }) => {
    await page.goto('/#/explore?view=map')
    await expect(page.locator('.leaflet-container')).toBeVisible()
    await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible()
  })

  test('the client shortlist page stays chrome-free and account-free', async ({ page }) => {
    await page.goto(`/#/list?spots=${SPOT},fort-de-soto-park&title=Smith%20family`)
    await expect(page.getByText('Smith family')).toBeVisible()
    await expect(page.locator('nav.tabbar')).toHaveCount(0)
    await expect(signInWall(page)).toHaveCount(0)
  })

  test('nothing signs a guest in, or pushes their data, behind their back', async ({ page }) => {
    await page.goto(`/#/spot/${SPOT}`)
    await expect(page.getByRole('heading', { name: SPOT_NAME })).toBeVisible()
    expect(supabaseCalls.filter((c) => c.includes('/auth/v1/token') || c.includes('/auth/v1/signup'))).toEqual([])
    expect(supabaseCalls.filter((c) => c.startsWith('POST /rest/v1/vantage_state'))).toEqual([])
  })
})

test.describe('sign-in is asked for at the action, in place', () => {
  test('saving a spot opens the sheet over the spot; "Not now" returns to browsing', async ({ page }) => {
    await page.goto(`/#/spot/${SPOT}`)
    await page.getByRole('button', { name: /want to go/i }).click()
    await expect(sheet(page)).toBeVisible()
    await expect(sheet(page).getByRole('heading', { name: /keep your spots/i })).toBeVisible()
    await expect(sheet(page).getByText(SPOT_NAME)).toBeVisible()

    await sheet(page).getByRole('button', { name: /not now/i }).click()
    await expect(sheet(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /want to go/i })).toBeVisible()
    expect(page.url()).toContain(`#/spot/${SPOT}`)
  })

  test('creating an account from the sheet finishes the save, on the same screen', async ({ page }) => {
    await page.goto(`/#/spot/${SPOT}`)
    await page.getByRole('button', { name: /want to go/i }).click()
    await sheet(page).getByLabel('Email').fill('new.e2e@example.test')
    await sheet(page).getByLabel('Password').fill('golden hour 42')
    await sheet(page).getByRole('button', { name: /create account/i }).click()

    await expect(sheet(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /on your list/i })).toBeVisible()
    expect(page.url()).toContain(`#/spot/${SPOT}`)
    expect(supabaseCalls.some((c) => c.startsWith('POST /auth/v1/signup'))).toBe(true)
    // Signed in now: the upload control replaces the sign-in prompt.
    await expect(page.getByRole('button', { name: /sign in to add your shots/i })).toHaveCount(0)
  })

  test('Google comes back from its redirect to the screen it left', async ({ page }) => {
    await page.goto(`/#/spot/${SPOT}`)
    await page.getByRole('button', { name: /been there/i }).click()
    await sheet(page).getByRole('button', { name: /continue with google/i }).click()

    await page.waitForURL(`**/#/spot/${SPOT}`)
    await expect(page.getByRole('heading', { name: SPOT_NAME })).toBeVisible()
    expect(new URL(page.url()).search).toBe('') // the one-time ?code= is gone
    expect(supabaseCalls.some((c) => c.startsWith('POST /auth/v1/token?grant_type=pkce'))).toBe(true)
    await page.goto('/#/settings')
    await expect(page.getByText(E2E_USER.email)).toBeVisible()
  })

  test('voting asks with its own reason', async ({ page }) => {
    await page.goto('/#/community')
    await page.getByRole('button', { name: /cast your vote/i }).click()
    await expect(sheet(page).getByText(/one vote per person/i)).toBeVisible()
  })

  test('saving a day plan asks; sharing its link does not', async ({ page }) => {
    await page.goto(`/#/day?date=2026-10-03&stops=sunset:${SPOT}`)
    await page.getByRole('button', { name: /share plan/i }).click()
    await expect(sheet(page)).toHaveCount(0)
    await page.getByRole('button', { name: /save plan/i }).click()
    await expect(sheet(page).getByRole('heading', { name: /keep your spots/i })).toBeVisible()
  })

  test('Settings leads to the full sign-in page, which leads straight back', async ({ page }) => {
    await page.goto('/#/settings')
    await page.getByRole('button', { name: /sign in or create a free account/i }).click()
    await expect(signInWall(page)).toBeVisible()
    await page.getByRole('button', { name: /continue without an account/i }).click()
    await page.waitForURL('**/#/settings')
    await expect(page.locator('nav.tabbar a')).toHaveCount(5)
  })
})

test.describe('accessibility of the sign-in surfaces', () => {
  const serious = async (page: Page) => {
    const results = await new AxeBuilder({ page }).analyze()
    return results.violations
      .filter((v) => v.impact === 'critical' || v.impact === 'serious')
      .map((v) => `${v.id}: ${v.nodes.map((n) => String(n.target)).join(', ')}`)
  }

  test('the sign-in sheet', async ({ page }) => {
    await page.goto(`/#/spot/${SPOT}`)
    await page.getByRole('button', { name: /want to go/i }).click()
    await expect(sheet(page)).toBeVisible()
    expect(await serious(page)).toEqual([])
  })

  test('the sign-in page', async ({ page }) => {
    await page.goto('/#/signin?next=%2Fyou')
    await expect(signInWall(page)).toBeVisible()
    expect(await serious(page)).toEqual([])
  })
})
