import { describe, it, expect } from 'vitest'
import tampa from '../../src/data/spots/tampa-bay'
import philadelphia from '../../src/data/spots/philadelphia'
const SPOTS = [...tampa, ...philadelphia]
import { type Light } from '../../src/spots/types'

const LIGHTS: Light[] = [
  'sunrise', 'morning-golden', 'blue-hour', 'daytime',
  'evening-golden', 'sunset', 'night-astro', 'open-shade',
]
// Free / attribution-clean licenses we accept from Wikimedia Commons.
const FREE_LICENSE = /^(CC BY|CC BY-SA|CC0|Public domain|No restrictions)/i

describe('spot media (seeded reference photos)', () => {
  it('a meaningful share of spots have at least one photo', () => {
    const withMedia = SPOTS.filter((s) => s.media.length > 0)
    expect(withMedia.length).toBeGreaterThanOrEqual(12)
  })

  it('the Tampa murals spot has a seeded photo of the anchor mural', () => {
    const murals = SPOTS.find((s) => s.id === 'tampa-murals')
    expect(murals?.media.length).toBeGreaterThan(0)
  })

  it('every media entry is well-formed and attributed', () => {
    for (const s of SPOTS) {
      for (const m of s.media) {
        expect(m.src, `${s.id} src`).toMatch(/^https:\/\//)
        if (m.thumb) expect(m.thumb, `${s.id} thumb`).toMatch(/^https:\/\//)
        expect(m.caption.trim().length, `${s.id} caption`).toBeGreaterThan(0)
        expect(m.credit.trim().length, `${s.id} credit`).toBeGreaterThan(0)
        expect(m.license.trim().length, `${s.id} license`).toBeGreaterThan(0)
        expect(FREE_LICENSE.test(m.license), `${s.id} license "${m.license}" must be free/attribution`).toBe(true)
        if (m.sourceUrl) expect(m.sourceUrl, `${s.id} sourceUrl`).toMatch(/^https:\/\//)
        if (m.light) expect(LIGHTS, `${s.id} light`).toContain(m.light)
        // Photo specs (EXIF-sourced) must be plausible camera values when present.
        if (m.camera) expect(m.camera.trim().length, `${s.id} camera`).toBeGreaterThan(0)
        if (m.focalLengthMm != null) {
          expect(m.focalLengthMm, `${s.id} focal`).toBeGreaterThan(0)
          expect(m.focalLengthMm, `${s.id} focal`).toBeLessThan(2000)
        }
        if (m.fNumber != null) {
          expect(m.fNumber, `${s.id} fNumber`).toBeGreaterThanOrEqual(0.7)
          expect(m.fNumber, `${s.id} fNumber`).toBeLessThanOrEqual(64)
        }
        if (m.shutter) expect(m.shutter, `${s.id} shutter`).toMatch(/^\d+(\.\d+)?(\/\d+(\.\d+)?)?s?$/)
        if (m.iso != null) {
          expect(Number.isInteger(m.iso), `${s.id} iso integer`).toBe(true)
          expect(m.iso, `${s.id} iso`).toBeGreaterThanOrEqual(25)
          expect(m.iso, `${s.id} iso`).toBeLessThanOrEqual(409600)
        }
      }
    }
  })

  it('media images come from allowed hosts (Wikimedia Commons, Flickr, or own)', () => {
    for (const s of SPOTS) {
      for (const m of s.media) {
        const host = new URL(m.src).host
        expect(
          /(^|\.)wikimedia\.org$/.test(host) || host === 'upload.wikimedia.org' ||
          host === 'live.staticflickr.com' || m.src.startsWith('/'),
          `${s.id} host ${host}`,
        ).toBe(true)
      }
    }
  })
})
