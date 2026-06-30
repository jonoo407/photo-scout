import { describe, it, expect } from 'vitest'
import { REGIONS, REGION_IDS, regionContains, regionForPoint, nearestRegion } from '../../src/data/regions'

describe('region registry', () => {
  it('defines Tampa Bay and Philadelphia', () => {
    expect(REGION_IDS).toEqual(expect.arrayContaining(['tampa-bay', 'philadelphia']))
  })

  it('each region default home sits inside its own bounds', () => {
    for (const r of Object.values(REGIONS)) {
      expect(regionContains(r, r.defaultHome.lat, r.defaultHome.lng), `${r.id} default home`).toBe(true)
    }
  })

  it('maps points to the right region (and null when outside)', () => {
    expect(regionForPoint(27.95, -82.46)).toBe('tampa-bay') // downtown Tampa
    expect(regionForPoint(39.9526, -75.1652)).toBe('philadelphia') // Center City
    expect(regionForPoint(40.71, -74.0)).toBeNull() // NYC — outside both
  })

  it('nearestRegion picks the containing city, else the closest', () => {
    expect(nearestRegion(27.95, -82.46)).toBe('tampa-bay') // inside Tampa
    expect(nearestRegion(39.95, -75.16)).toBe('philadelphia') // inside Philly
    expect(nearestRegion(40.71, -74.0)).toBe('philadelphia') // NYC → closer to Philly
    expect(nearestRegion(33.75, -84.39)).toBe('tampa-bay') // Atlanta → closer to Tampa
  })

  it('the two regions do not overlap', () => {
    const t = REGIONS['tampa-bay'].center
    const p = REGIONS.philadelphia.center
    expect(regionContains(REGIONS.philadelphia, t.lat, t.lng)).toBe(false)
    expect(regionContains(REGIONS['tampa-bay'], p.lat, p.lng)).toBe(false)
  })
})
