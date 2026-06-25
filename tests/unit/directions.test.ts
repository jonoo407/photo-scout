import { describe, it, expect } from 'vitest'
import { directionsUrl } from '../../src/spots/live'
import type { Spot } from '../../src/spots/types'
import type { HomeLocation } from '../../src/data/home.config'

const HOME: HomeLocation = { label: 'Home', lat: 27.8916, lng: -82.4843 }

function spotWith(over: Partial<Spot>): Spot {
  return {
    id: 'x', name: 'X', category: 'skyline', city: 'Tampa', region: 'tampa-bay',
    bestFor: [], bestLight: ['sunset'], lat: 27.95, lng: -82.46, facing: null,
    feeUSD: 0, isFree: true, hours: { days: {} as never }, phone: null, notes: '',
    craft: { lightStrategy: '', whatToShoot: [], signatureShots: [], compositionTips: [], gear: {} },
    media: [],
    ...over,
  } as Spot
}

describe('directionsUrl', () => {
  it('routes Google to the street address when present (not raw coords)', () => {
    const spot = spotWith({ address: '506 E Harrison St, Tampa, FL 33602', lat: 27.9512, lng: -82.4555 })
    const url = directionsUrl(spot, HOME, 'google')
    expect(url).toContain(`destination=${encodeURIComponent('506 E Harrison St, Tampa, FL 33602')}`)
    expect(url).not.toContain('destination=27.9512')
  })

  it('routes Apple Maps to the street address when present', () => {
    const spot = spotWith({ address: '506 E Harrison St, Tampa, FL 33602' })
    const url = directionsUrl(spot, HOME, 'apple')
    expect(url).toContain(`daddr=${encodeURIComponent('506 E Harrison St, Tampa, FL 33602')}`)
  })

  it('falls back to coordinates when the spot has no address', () => {
    const spot = spotWith({ address: undefined, lat: 27.95, lng: -82.46 })
    expect(directionsUrl(spot, HOME, 'google')).toContain('destination=27.95,-82.46')
    expect(directionsUrl(spot, HOME, 'apple')).toContain('daddr=27.95,-82.46')
  })
})
