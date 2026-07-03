import { test } from '@playwright/test'

const LIVE = 'https://shootvantage.com'
const shots: [string, string, number][] = [
  ['rv-today', '/', 1500],
  ['rv-browse', '/#/browse', 1200],
  ['rv-spot', '/#/spot/curtis-hixon-waterfront-park', 2000],
  ['rv-map', '/#/map', 2600],
  ['rv-plan', '/#/plan', 1200],
  ['rv-day', '/#/day', 1500],
]

for (const [name, path, wait] of shots) {
  test(`live ${name}`, async ({ page }) => {
    await page.goto(LIVE + path)
    await page.waitForTimeout(wait)
    await page.screenshot({ path: `e2e/screens/${name}.png`, fullPage: name !== 'rv-map' })
  })
}

test('live first-run (cleared storage)', async ({ page, context }) => {
  await context.clearCookies()
  await page.goto(LIVE)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'e2e/screens/rv-firstrun.png', fullPage: true })
})
