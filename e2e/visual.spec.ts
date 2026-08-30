import { test, expect } from '@playwright/test'
import fs from 'node:fs'

const SHOTS = 'e2e/screens'
fs.mkdirSync(SHOTS, { recursive: true })

const routes: [string, string][] = [
  ['today', '/'],
  ['explore', '/#/explore'],
  ['map', '/#/explore?view=map'],
  ['plan', '/#/plan'],
  ['day', '/#/day'],
  ['you', '/#/you'],
  ['community', '/#/community'],
  ['spot', '/#/spot/curtis-hixon-waterfront-park'],
  ['settings', '/#/settings'],
]

for (const [name, path] of routes) {
  test(`screenshot ${name}`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(name === 'map' ? 2500 : 700)
    await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true })
    // A screenshot of a white screen is still a screenshot. There is no
    // committed baseline to diff against, so assert at least that we shot
    // something real — otherwise these tests cannot fail at all.
    await expect(page.locator('nav.tabbar a')).toHaveCount(5)
    expect((await page.locator('#root').innerText()).trim().length,
      `${name} rendered almost nothing — the screenshot is of a blank screen`).toBeGreaterThan(120)
  })
}

test('spot best-days (coastal, with tides)', async ({ page }) => {
  await page.goto('/#/spot/fort-de-soto-park')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(2500) // let forecast + NOAA tides resolve
  await page.screenshot({ path: `${SHOTS}/spot-bestdays.png`, fullPage: true })
})

test('switch city to Philadelphia (scoping)', async ({ page }) => {
  await page.goto('/#/settings')
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Philadelphia' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${SHOTS}/settings-philly.png`, fullPage: true })
  await page.goto('/')
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${SHOTS}/today-philly.png`, fullPage: true })
  await page.goto('/#/explore?view=map')
  await page.waitForTimeout(2600)
  await page.screenshot({ path: `${SHOTS}/map-philly.png` })
})

test('dark theme (Today)', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' }) // theme=auto follows system → dark
  await page.goto('/')
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${SHOTS}/today-dark.png`, fullPage: true })
})

test('day plan swap chooser', async ({ page }) => {
  await page.goto('/#/day')
  await page.waitForTimeout(700)
  await page.getByRole('button', { name: /swap .*spot/i }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/day-chooser.png`, fullPage: true })
})

test('day plan weather indicator (forced rain)', async ({ page }) => {
  await page.route('**api.open-meteo.com**', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ hourly: { time: [Math.floor(Date.now() / 1000)], precipitation_probability: [90], cloud_cover: [95] } }),
  }))
  await page.goto('/#/day')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${SHOTS}/day-rain.png`, fullPage: true })
})

/* The only test that drives the real Leaflet map. MapView is mocked out of
   every unit test (it needs a real layout engine), so this is where pin
   rendering and tap-to-select are actually proven — hence real assertions
   rather than the swallowed click this used to be. */
test('map pin popup', async ({ page }) => {
  await page.goto('/#/explore?view=map')
  await page.waitForTimeout(2500)

  // Spot pins are circleMarkers, so SVG paths — `.leaflet-interactive` alone
  // would also match the home divIcon marker, which carries a tooltip but no
  // click handler.
  const pins = page.locator('path.leaflet-interactive')
  expect(await pins.count(), 'no spot pins rendered on the map').toBeGreaterThan(5)

  await expect(page.locator('.spotcard')).toHaveCount(0) // nothing selected yet

  // Tap the first pin that is actually on top at its own centre. At the
  // fitBounds zoom some pins sit under the home marker's divIcon or under a
  // neighbouring pin, and a tap there legitimately goes to that other element
  // — forcing it through would prove nothing about what a user can reach.
  const tappable = await page.evaluate(() => {
    const paths = [...document.querySelectorAll('path.leaflet-interactive')]
    return paths.findIndex((p) => {
      const b = p.getBoundingClientRect()
      return document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2) === p
    })
  })
  expect(tappable, 'every map pin is occluded — nothing is tappable').toBeGreaterThanOrEqual(0)

  await pins.nth(tappable).tap()
  await expect(page.locator('.spotcard')).toHaveCount(1) // tap surfaces the card

  await page.screenshot({ path: `${SHOTS}/map-popup.png` })

  // Tapping bare map dismisses the card again. Find a point that is actually
  // bare tiles — the top-left corner is the zoom control and the bottom-right
  // is the attribution, so a fixed offset picks a Leaflet control instead.
  const bare = await page.evaluate(() => {
    const map = document.querySelector('#map')!.getBoundingClientRect()
    for (let dy = 0.2; dy < 0.9; dy += 0.1) {
      for (let dx = 0.2; dx < 0.9; dx += 0.1) {
        const x = map.x + map.width * dx, y = map.y + map.height * dy
        const el = document.elementFromPoint(x, y)
        // A loaded tile, or the container itself when tiles are blocked (CI
        // runners have no route to tile.openstreetmap.org). Either is bare map.
        const bareTile = el && (el.closest('.leaflet-tile-pane') || el.classList.contains('leaflet-container'))
        if (bareTile) return { x: map.width * dx, y: map.height * dy }
      }
    }
    return null
  })
  expect(bare, 'found no bare map tile to tap').not.toBeNull()
  await page.locator('#map').tap({ position: bare! })
  await expect(page.locator('.spotcard')).toHaveCount(0)
})
