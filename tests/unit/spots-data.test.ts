import { describe, it, expect } from 'vitest'
import tampa from '../../src/data/spots/tampa-bay'
import philadelphia from '../../src/data/spots/philadelphia'
const SPOTS = [...tampa, ...philadelphia]
import { CATEGORIES, type Light } from '../../src/spots/types'
import { REGIONS, REGION_IDS, regionContains } from '../../src/data/regions'

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const LIGHTS: Light[] = [
  'sunrise', 'morning-golden', 'blue-hour', 'daytime',
  'evening-golden', 'sunset', 'night-astro', 'open-shade',
]

describe('Tampa spot dataset', () => {
  it('has the full set of spots', () => {
    expect(SPOTS.length).toBeGreaterThanOrEqual(28)
  })

  it('has unique, kebab-case ids', () => {
    const ids = SPOTS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('every spot has valid core fields', () => {
    for (const s of SPOTS) {
      expect(s.name.length).toBeGreaterThan(0)
      expect(CATEGORIES).toContain(s.category)
      expect(REGION_IDS, `${s.id} region`).toContain(s.region)
      expect(regionContains(REGIONS[s.region], s.lat, s.lng), `${s.id} within ${s.region} bounds`).toBe(true)
      expect(s.facing === null || (s.facing >= 0 && s.facing < 360)).toBe(true)
      expect(s.feeUSD).toBeGreaterThanOrEqual(0)
      expect(typeof s.isFree).toBe('boolean')
      expect(s.phone === null || typeof s.phone === 'string').toBe(true)
    }
  })

  it('every spot has a complete weekly schedule', () => {
    for (const s of SPOTS) {
      for (const d of WEEKDAYS) expect(s.hours.days).toHaveProperty(d)
    }
  })

  it('every spot has at least one best-light tag, all valid', () => {
    for (const s of SPOTS) {
      expect(s.bestLight.length).toBeGreaterThan(0)
      for (const l of s.bestLight) expect(LIGHTS).toContain(l)
    }
  })

  it('every spot has a craft guide with signature shots', () => {
    for (const s of SPOTS) {
      expect(s.craft.whatToShoot.length).toBeGreaterThan(0)
      expect(s.craft.signatureShots.length).toBeGreaterThan(0)
      expect(s.craft.lightStrategy.length).toBeGreaterThan(0)
      const shotIds = s.craft.signatureShots.map((x) => x.id)
      expect(new Set(shotIds).size).toBe(shotIds.length)
    }
  })

  it('covers all seven categories', () => {
    const cats = new Set(SPOTS.map((s) => s.category))
    for (const c of CATEGORIES) expect(cats).toContain(c)
  })

  it('every spot has a verified street address (street + city)', () => {
    for (const s of SPOTS) {
      expect(typeof s.address, `${s.id} address`).toBe('string')
      expect(s.address.trim().length, `${s.id} address`).toBeGreaterThan(0)
      expect(s.address, `${s.id} address`).toMatch(/,/)
    }
  })

  it('no spot is left flagged coordsNeedVerify', () => {
    for (const s of SPOTS) {
      expect(s.coordsNeedVerify ?? false, `${s.id} coordsNeedVerify`).toBe(false)
    }
  })

  it('fee and isFree are consistent (free if and only if $0)', () => {
    for (const s of SPOTS) {
      expect(s.isFree, `${s.id}: isFree=${s.isFree} but feeUSD=${s.feeUSD}`).toBe(s.feeUSD === 0)
    }
  })

  it('skyline-across-the-bay spots face toward downtown (NE), not away from it', () => {
    for (const id of ['bayshore-boulevard', 'ballast-point-park']) {
      const s = SPOTS.find((x) => x.id === id)
      expect(s, id).toBeDefined()
      expect(s!.facing, `${id} facing should point NE toward the skyline`).not.toBeNull()
      expect(s!.facing!).toBeGreaterThan(0)
      expect(s!.facing!).toBeLessThan(90)
    }
  })

  it('Philadelphia has a real set of spots', () => {
    expect(philadelphia.length).toBeGreaterThanOrEqual(45)
    for (const s of philadelphia) expect(s.region).toBe('philadelphia')
  })

  it('covers the Manayunk area with at least 4 spots', () => {
    // Manayunk neighborhood + the three canal/bridge/dam spots along the Schuylkill NW corridor
    const manayunkArea = philadelphia.filter((s) => s.lat > 40.01 && s.lat < 40.05 && s.lng < -75.2)
    expect(manayunkArea.length).toBeGreaterThanOrEqual(4)
  })

  it('St. Paul AME is named explicitly as a church with verified coords', () => {
    const s = SPOTS.find((x) => x.id === 'st-paul-ame')
    expect(s).toBeDefined()
    expect(s!.name.toLowerCase()).toContain('church')
    expect(s!.coordsNeedVerify ?? false).toBe(false)
  })
})
