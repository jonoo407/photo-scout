import { describe, it, expect } from 'vitest'
import {
  pinSpecs, sunLineSpecs, viewForPins, keepSelection, SUNRISE_COLOR, SUNSET_COLOR,
} from '../../src/ui/Explore/map-model'
import { CATEGORY_COLOR, type Spot } from '../../src/spots/types'
import { DEFAULT_HOME } from '../../src/data/home.config'
import tampa from '../../src/data/spots/tampa-bay'

/* Explore's map lens. MapView itself needs a real layout engine, so every unit
   test mocks it out and its decisions went uncovered; the Playwright map test
   proves Leaflet renders and responds, and this proves the decisions it draws
   from are right. */

const spot = (over: Partial<Spot> = {}): Spot => ({ ...tampa[0], ...over })

describe('pinSpecs', () => {
  it('emits one pin per spot, in order', () => {
    const spots = [spot({ id: 'a' }), spot({ id: 'b' }), spot({ id: 'c' })]
    expect(pinSpecs(spots).map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('colours each pin by category so the map and the list agree', () => {
    const s = spot({ category: 'skyline' })
    expect(pinSpecs([s])[0].style.fillColor).toBe(CATEGORY_COLOR.skyline)
    expect(pinSpecs([spot({ category: 'beach' })])[0].style.fillColor).toBe(CATEGORY_COLOR.beach)
  })

  it('names the pin so the tooltip identifies it', () => {
    expect(pinSpecs([spot({ name: 'Bayshore Boulevard' })])[0].tooltip).toBe('Bayshore Boulevard')
  })

  it('draws a white ring on every pin, whatever the category', () => {
    for (const p of pinSpecs(tampa)) {
      expect(p.style.color).toBe('#fff')
      expect(p.style.fillOpacity).toBe(1)
    }
  })

  it('returns nothing for an empty filter result', () => {
    expect(pinSpecs([])).toEqual([])
  })
})

describe('viewForPins', () => {
  it('fits home plus every pin when there are spots', () => {
    const spots = [spot({ lat: 27.9, lng: -82.5 }), spot({ lat: 28.1, lng: -82.7 })]
    const view = viewForPins(spots, DEFAULT_HOME)
    expect(view.kind).toBe('bounds')
    if (view.kind !== 'bounds') throw new Error('unreachable')
    expect(view.bounds).toHaveLength(3) // home + 2 spots
    expect(view.bounds[0]).toEqual([DEFAULT_HOME.lat, DEFAULT_HOME.lng])
    expect(view.pad).toBeGreaterThan(0) // pins on the edge must not touch the frame
  })

  it('centres on home at city zoom when the filter excludes everything', () => {
    // fitBounds on a single point zooms to street level, which reads as a bug.
    const view = viewForPins([], DEFAULT_HOME)
    expect(view).toEqual({ kind: 'center', center: [DEFAULT_HOME.lat, DEFAULT_HOME.lng], zoom: 11 })
  })

  it('still produces bounds for a single spot, so home stays in frame', () => {
    const view = viewForPins([spot({ lat: 27.9, lng: -82.5 })], DEFAULT_HOME)
    expect(view.kind).toBe('bounds')
  })
})

describe('sunLineSpecs', () => {
  const TAMPA = { lat: 27.94, lng: -82.46 }
  const JUNE = new Date(2026, 5, 30, 12, 0)

  it('draws a sunrise and a sunset line from the spot', () => {
    const lines = sunLineSpecs(TAMPA.lat, TAMPA.lng, JUNE)
    expect(lines.map((l) => l.kind)).toEqual(['sunrise', 'sunset'])
    for (const l of lines) expect(l.from).toEqual([TAMPA.lat, TAMPA.lng])
  })

  it('colours sunrise gold and sunset terracotta, matching the legend', () => {
    const [sunrise, sunset] = sunLineSpecs(TAMPA.lat, TAMPA.lng, JUNE)
    expect(sunrise.color).toBe(SUNRISE_COLOR)
    expect(sunset.color).toBe(SUNSET_COLOR)
  })

  it('labels each line with its rounded bearing', () => {
    const [sunrise, sunset] = sunLineSpecs(TAMPA.lat, TAMPA.lng, JUNE)
    expect(sunrise.label).toMatch(/^Sunrise · \d{1,3}°$/)
    expect(sunset.label).toMatch(/^Sunset · \d{1,3}°$/)
  })

  it('points sunrise east and sunset west', () => {
    const [sunrise, sunset] = sunLineSpecs(TAMPA.lat, TAMPA.lng, JUNE)
    expect(sunrise.to[1]).toBeGreaterThan(TAMPA.lng) // east = larger longitude
    expect(sunset.to[1]).toBeLessThan(TAMPA.lng)
  })

  it('swings north in June and south in December', () => {
    const june = sunLineSpecs(TAMPA.lat, TAMPA.lng, new Date(2026, 5, 21, 12))
    const dec = sunLineSpecs(TAMPA.lat, TAMPA.lng, new Date(2026, 11, 21, 12))
    expect(june[0].to[0]).toBeGreaterThan(dec[0].to[0]) // summer sunrise is further north
  })

  it('omits a line the location does not get — a polar day has no sunrise', () => {
    const lines = sunLineSpecs(78.2, 15.6, new Date(2026, 5, 21, 12)) // Svalbard, midnight sun
    expect(lines.length).toBeLessThan(2)
  })
})

describe('keepSelection', () => {
  const a = spot({ id: 'a' })

  it('keeps the card while its spot is still on the map', () => {
    expect(keepSelection(a, [a, spot({ id: 'b' })])).toBe(true)
  })

  it('drops the card when a filter change removes its spot', () => {
    expect(keepSelection(a, [spot({ id: 'b' })])).toBe(false)
    expect(keepSelection(a, [])).toBe(false)
  })

  it('is false when nothing is selected', () => {
    expect(keepSelection(null, [a])).toBe(false)
  })
})
