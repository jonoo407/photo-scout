import { describe, it, expect } from 'vitest'
import { geocodeAddress } from '../../src/spots/geocode'

const okFetch = (rows: unknown) =>
  (async () => ({ ok: true, json: async () => rows })) as unknown as typeof fetch

describe('geocodeAddress', () => {
  it('resolves a typed address to a home result', async () => {
    const fetchImpl = okFetch([{ lat: '27.9147158', lon: '-82.5064028', display_name: '3812, West Leona Street, Tampa' }])
    const r = await geocodeAddress('3812 W Leona St, Tampa', fetchImpl)
    expect(r).toEqual({
      label: '3812 W Leona St, Tampa',
      address: '3812 W Leona St, Tampa',
      lat: 27.9147158,
      lng: -82.5064028,
    })
  })

  it('returns null for an empty/whitespace query without calling the network', async () => {
    const exploding = (async () => { throw new Error('should not fetch') }) as unknown as typeof fetch
    expect(await geocodeAddress('   ', exploding)).toBeNull()
  })

  it('returns null when the geocoder finds nothing', async () => {
    expect(await geocodeAddress('zzzqqq nowhere', okFetch([]))).toBeNull()
  })

  it('returns null on a non-ok HTTP response', async () => {
    const bad = (async () => ({ ok: false, json: async () => [] })) as unknown as typeof fetch
    expect(await geocodeAddress('x', bad)).toBeNull()
  })

  it('returns null when coordinates are not finite numbers', async () => {
    expect(await geocodeAddress('x', okFetch([{ lat: 'abc', lon: 'def' }]))).toBeNull()
  })
})
