// @vitest-environment node
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import sharp from 'sharp'

/*
 * Capacitor ships a placeholder app icon, and it shipped to TestFlight through
 * build 9 — the home screen showed Capacitor's mark, not Vantage's.
 *
 * Two iOS rules make this more than cosmetic: app icons must be fully OPAQUE
 * (alpha is rejected at submission) and must NOT be pre-rounded, because iOS
 * applies its own mask — a rounded source produces visible double-rounded
 * corners. Our icon.svg has rx="116", so it has to be flattened square.
 */
const ICON = path.resolve(__dirname, '../../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')
const SPLASH = path.resolve(__dirname, '../../ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png')
const BRAND_CREAM = { r: 0xfa, g: 0xf1, b: 0xe2 }

describe('iOS app icon', () => {
  it('is the 1024px square Apple requires', async () => {
    const m = await sharp(ICON).metadata()
    expect([m.width, m.height]).toEqual([1024, 1024])
  })

  it('is fully opaque — alpha is rejected at submission', async () => {
    const m = await sharp(ICON).metadata()
    expect(m.hasAlpha, 'app icon must have no alpha channel').toBe(false)
  })

  it('is our brand, and square rather than pre-rounded', async () => {
    // A corner pixel proves both at once: Capacitor's placeholder is not cream,
    // and a pre-rounded source would leave the corner transparent or black.
    const { data } = await sharp(ICON).extract({ left: 0, top: 0, width: 4, height: 4 })
      .raw().toBuffer({ resolveWithObject: true })
    expect(Math.abs(data[0] - BRAND_CREAM.r)).toBeLessThanOrEqual(4)
    expect(Math.abs(data[1] - BRAND_CREAM.g)).toBeLessThanOrEqual(4)
    expect(Math.abs(data[2] - BRAND_CREAM.b)).toBeLessThanOrEqual(4)
  })
})

describe('iOS splash', () => {
  it('is the 2732px square Capacitor scales from', async () => {
    const m = await sharp(SPLASH).metadata()
    expect([m.width, m.height]).toEqual([2732, 2732])
  })

  it('sits on the brand background so launch does not flash white', async () => {
    const { data } = await sharp(SPLASH).extract({ left: 0, top: 0, width: 4, height: 4 })
      .raw().toBuffer({ resolveWithObject: true })
    expect(Math.abs(data[0] - BRAND_CREAM.r)).toBeLessThanOrEqual(4)
    expect(Math.abs(data[2] - BRAND_CREAM.b)).toBeLessThanOrEqual(4)
  })
})
