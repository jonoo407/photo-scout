import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
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

test('map pin popup', async ({ page }) => {
  await page.goto('/#/explore?view=map')
  await page.waitForTimeout(2500)
  await page.locator('.leaflet-interactive').first().click({ force: true }).catch(() => {})
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${SHOTS}/map-popup.png` })
})

const a11yRoutes: [string, string][] = [
  ['today', '/'],
  ['explore', '/#/explore'],
  ['plan', '/#/plan'],
  ['day', '/#/day'],
  ['you', '/#/you'],
  ['community', '/#/community'],
  ['spot', '/#/spot/curtis-hixon-waterfront-park'],
  ['settings', '/#/settings'],
]
for (const [name, path] of a11yRoutes) {
  test(`a11y ${name}`, async ({ page }) => {
    await page.goto(path)
    await page.waitForTimeout(700)
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    if (serious.length) {
      console.log(`\n[a11y ${name}] ${serious.length} serious/critical:`)
      for (const v of serious) {
        console.log(`  - ${v.id} (${v.impact}) x${v.nodes.length}: ${v.help}`)
        for (const node of v.nodes.slice(0, 6)) {
          const d = node.any?.[0]?.data
          const info = d ? `fg=${d.fgColor} bg=${d.bgColor} ratio=${d.contrastRatio} need=${d.expectedContrastRatio} size=${d.fontSize}` : ''
          console.log(`      ${String(node.target)} | ${info}`)
        }
      }
    }
    expect.soft(serious.map((v) => v.id), `${name} serious/critical a11y violations`).toEqual([])
  })
}
