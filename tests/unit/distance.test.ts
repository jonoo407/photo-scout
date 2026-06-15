import { describe, it, expect } from 'vitest'
import { haversineMiles, type LatLng } from '../../src/spots/distance'

const home: LatLng = { lat: 27.8916, lng: -82.4843 }
const curtisHixon: LatLng = { lat: 27.9489, lng: -82.4616 }

describe('haversineMiles', () => {
  it('is 0 between a point and itself', () => {
    expect(haversineMiles(home, home)).toBeCloseTo(0, 5)
  })
  it('is symmetric', () => {
    expect(haversineMiles(home, curtisHixon)).toBeCloseTo(haversineMiles(curtisHixon, home), 6)
  })
  it('computes a sane Tampa distance (~4 miles home -> Curtis Hixon)', () => {
    const d = haversineMiles(home, curtisHixon)
    expect(d).toBeGreaterThan(3.5)
    expect(d).toBeLessThan(5)
  })
  it('1 degree of latitude is ~69 miles', () => {
    expect(haversineMiles({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(69, 0)
  })
})
