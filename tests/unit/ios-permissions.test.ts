// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/*
 * iOS fails CLOSED and SILENTLY on missing permission strings: with no
 * NSLocationWhenInUseUsageDescription, navigator.geolocation.getCurrentPosition
 * never prompts and never invokes either callback. The UI just spins — which is
 * exactly what TestFlight build 8 did on "Detecting…" forever.
 *
 * Rendering tests cannot catch this, so instead this ties WEB API USAGE to the
 * NATIVE DECLARATION it requires: use the API in src/, declare it in Info.plist.
 */
const ROOT = path.resolve(__dirname, '../..')
const plist = fs.readFileSync(path.join(ROOT, 'ios/App/App/Info.plist'), 'utf8')

function srcUses(pattern: RegExp): boolean {
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) return walk(p)
      return /\.tsx?$/.test(e.name) ? [p] : []
    })
  return walk(path.join(ROOT, 'src')).some((f) => pattern.test(fs.readFileSync(f, 'utf8')))
}

/** A usage string must exist AND say something — iOS rejects empty ones. */
function declares(key: string): boolean {
  const m = plist.match(new RegExp(`<key>${key}</key>\\s*<string>([^<]*)</string>`))
  return !!m && m[1].trim().length > 10
}

describe('iOS permission declarations match what the app actually calls', () => {
  it('declares location use, since the app calls navigator.geolocation', () => {
    expect(srcUses(/navigator\.geolocation/)).toBe(true)
    expect(declares('NSLocationWhenInUseUsageDescription'), 'NSLocationWhenInUseUsageDescription').toBe(true)
  })

  it('declares photo library use, since the app has file inputs for photo upload', () => {
    expect(srcUses(/type="file"/)).toBe(true)
    expect(declares('NSPhotoLibraryUsageDescription'), 'NSPhotoLibraryUsageDescription').toBe(true)
  })

  it('declares camera use, since photo pickers can offer the camera', () => {
    expect(declares('NSCameraUsageDescription'), 'NSCameraUsageDescription').toBe(true)
  })

  it('writes reasons a reviewer would accept, not placeholders', () => {
    const strings = [...plist.matchAll(/<key>(NS\w*UsageDescription)<\/key>\s*<string>([^<]*)<\/string>/g)]
    expect(strings.length).toBeGreaterThanOrEqual(3)
    for (const [, key, value] of strings) {
      expect(value, `${key} must explain WHY`).toMatch(/\b(so|to)\b/i)
      expect(value, `${key} placeholder`).not.toMatch(/TODO|xxx|lorem/i)
    }
  })
})
