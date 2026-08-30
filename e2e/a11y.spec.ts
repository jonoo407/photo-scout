import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/*
 * The accessibility gate. Split out of visual.spec.ts so it can run in CI as a
 * hard failure: it lived alongside the screenshot loop in a project CI never
 * started, with `expect.soft`, so a11y regressions could not redden a build.
 *
 * Scope is serious + critical only. Axe's minor/moderate findings are advisory
 * and shift between axe-core releases; gating on them would make dependency
 * bumps break the build for no user-visible reason.
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

for (const [name, path] of ROUTES) {
  test(`a11y ${name}`, async ({ page }) => {
    await page.goto(path)
    await page.waitForTimeout(700)

    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')

    // Print the detail before asserting — a bare rule id in CI output is not
    // enough to fix a contrast failure from.
    for (const v of serious) {
      console.log(`  - ${v.id} (${v.impact}) x${v.nodes.length}: ${v.help}`)
      for (const node of v.nodes.slice(0, 6)) {
        const d = node.any?.[0]?.data as Record<string, unknown> | undefined
        const info = d ? `fg=${d.fgColor} bg=${d.bgColor} ratio=${d.contrastRatio} need=${d.expectedContrastRatio} size=${d.fontSize}` : ''
        console.log(`      ${String(node.target)} | ${info}`)
      }
    }

    expect(serious.map((v) => v.id), `${name} serious/critical a11y violations`).toEqual([])
  })
}
