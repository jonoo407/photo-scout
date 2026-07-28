/*
 * Generate the iOS app icon and launch splash from the brand mark.
 *
 * Capacitor's placeholder icon shipped all the way to TestFlight build 9. Two
 * iOS rules shape what we produce:
 *   - app icons must be fully OPAQUE (alpha is rejected at submission)
 *   - they must NOT be pre-rounded; iOS applies its own mask, and a rounded
 *     source shows double-rounded corners
 * public/icon.svg carries rx="116", so it is flattened onto the same cream it
 * already uses — the corners fill in and the result is a clean square.
 *
 * Run: node scripts/gen-ios-icons.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const SRC = path.join(ROOT, 'public/icon.svg')
const ICON_DIR = path.join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset')
const SPLASH_DIR = path.join(ROOT, 'ios/App/App/Assets.xcassets/Splash.imageset')

const CREAM = { r: 0xfa, g: 0xf1, b: 0xe2 }
const ICON_PX = 1024
const SPLASH_PX = 2732
const SPLASH_MARK_PX = 900 // Capacitor scales this square to cover the screen

async function main() {
  const svg = await fs.readFile(SRC)

  // Rendering the SVG large then flattening keeps the pin/sun crisp and turns
  // the rounded corners into solid cream.
  const iconPng = await sharp(svg, { density: 400 })
    .resize(ICON_PX, ICON_PX, { fit: 'contain', background: CREAM })
    .flatten({ background: CREAM })
    .removeAlpha()
    .png()
    .toBuffer()
  await fs.writeFile(path.join(ICON_DIR, 'AppIcon-512@2x.png'), iconPng)
  console.log(`icon  ${ICON_PX}x${ICON_PX} opaque -> AppIcon-512@2x.png`)

  // Splash: the mark centred on brand cream, so launch never flashes white.
  const mark = await sharp(svg, { density: 400 })
    .resize(SPLASH_MARK_PX, SPLASH_MARK_PX, { fit: 'contain', background: { ...CREAM, alpha: 0 } })
    .png()
    .toBuffer()
  const splash = await sharp({
    create: { width: SPLASH_PX, height: SPLASH_PX, channels: 3, background: CREAM },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .flatten({ background: CREAM })
    .removeAlpha()
    .png()
    .toBuffer()

  // The imageset declares 1x/2x/3x; Capacitor ships them identical.
  for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    await fs.writeFile(path.join(SPLASH_DIR, name), splash)
  }
  console.log(`splash ${SPLASH_PX}x${SPLASH_PX} -> 3 imageset files`)
}

main().catch((e) => { console.error(e); process.exit(1) })
