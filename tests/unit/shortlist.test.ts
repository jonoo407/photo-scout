import { describe, it, expect } from 'vitest'
import {
  parseShortlist, shortlistUrl, bestLightWindow, MAX_SHORTLIST,
  storedShortlistUrl, buildListSpots, hasNewResponses, NOTE_MAX,
} from '../../src/spots/shortlist'
import { computeSunTimes } from '../../src/astro/sun-times'
import type { Light } from '../../src/spots/types'

const UUID = '3f8a2c1e-4b5d-4e6f-8a9b-0c1d2e3f4a5b'

describe('parseShortlist', () => {
  it('reads ids and title from a shortlist query string', () => {
    const r = parseShortlist('?spots=a,b,c&title=Smith+family')
    expect(r.ids).toEqual(['a', 'b', 'c'])
    expect(r.title).toBe('Smith family')
  })

  it('accepts a URLSearchParams (what useSearchParams provides)', () => {
    const r = parseShortlist(new URLSearchParams('spots=a,b'))
    expect(r.ids).toEqual(['a', 'b'])
    expect(r.title).toBeNull()
  })

  it('trims, drops empties, and dedupes ids', () => {
    expect(parseShortlist('?spots=a,%20b,,a,b').ids).toEqual(['a', 'b'])
  })

  it('returns empty for a missing/blank spots param', () => {
    expect(parseShortlist('?title=x').ids).toEqual([])
    expect(parseShortlist('?spots=').ids).toEqual([])
  })

  it('treats a blank title as absent', () => {
    expect(parseShortlist('?spots=a&title=').title).toBeNull()
    expect(parseShortlist('?spots=a&title=%20%20').title).toBeNull()
  })

  it(`caps the list at ${10} spots`, () => {
    const ids = Array.from({ length: 14 }, (_, i) => `s${i}`)
    expect(MAX_SHORTLIST).toBe(10)
    expect(parseShortlist(`?spots=${ids.join(',')}`).ids).toHaveLength(MAX_SHORTLIST)
  })
})

describe('parseShortlist — stored lists (v2)', () => {
  it('reads a stored-list id', () => {
    const r = parseShortlist(`?id=${UUID}`)
    expect(r.listId).toBe(UUID)
    expect(r.ids).toEqual([])
  })

  it('rejects a non-uuid id (no accidental API calls from mangled links)', () => {
    expect(parseShortlist('?id=not-a-uuid').listId).toBeNull()
    expect(parseShortlist('?spots=a,b').listId).toBeNull()
  })

  it('keeps inline spots as a fallback when both are present', () => {
    const r = parseShortlist(`?spots=a,b&id=${UUID}`)
    expect(r.listId).toBe(UUID)
    expect(r.ids).toEqual(['a', 'b'])
  })
})

describe('storedShortlistUrl', () => {
  it('builds the short client URL for a stored list', () => {
    expect(storedShortlistUrl(UUID)).toBe(`https://shootvantage.com/#/list?id=${UUID}`)
  })
})

describe('buildListSpots', () => {
  it('keeps pick order and attaches trimmed notes, dropping blank ones', () => {
    expect(buildListSpots(['a', 'b'], { a: '  golden hour magic  ', b: '   ' }))
      .toEqual([{ id: 'a', note: 'golden hour magic' }, { id: 'b' }])
  })

  it('ignores notes for unpicked spots and caps note length', () => {
    const long = 'x'.repeat(NOTE_MAX + 50)
    const out = buildListSpots(['a'], { a: long, zz: 'not picked' })
    expect(out).toHaveLength(1)
    expect(out[0].note).toHaveLength(NOTE_MAX)
  })
})

describe('hasNewResponses', () => {
  const lists = (times: string[]) => [{ responses: times.map((t, i) => ({ createdAt: t, id: `r${i}` })) }]

  it('is true when any response is newer than the last-seen time', () => {
    expect(hasNewResponses(lists(['2026-07-04T15:00:00Z']), '2026-07-01T00:00:00Z')).toBe(true)
  })

  it('is false when everything was already seen', () => {
    expect(hasNewResponses(lists(['2026-07-01T00:00:00Z']), '2026-07-02T00:00:00Z')).toBe(false)
  })

  it('never-seen counts every response as new; no responses is never new', () => {
    expect(hasNewResponses(lists(['2026-07-01T00:00:00Z']), null)).toBe(true)
    expect(hasNewResponses(lists([]), null)).toBe(false)
  })
})

describe('shortlistUrl', () => {
  it('builds the canonical share URL with readable commas', () => {
    expect(shortlistUrl(['a', 'b'], 'Smith family'))
      .toBe('https://shootvantage.com/#/list?spots=a,b&title=Smith+family')
  })

  it('omits the title param when absent', () => {
    expect(shortlistUrl(['a', 'b'])).toBe('https://shootvantage.com/#/list?spots=a,b')
  })

  it('round-trips through parseShortlist, including titles needing encoding', () => {
    const url = shortlistUrl(['spot-1', 'spot-2'], 'Smith & Vega — options')
    const query = url.slice(url.indexOf('?'))
    const r = parseShortlist(query)
    expect(r.ids).toEqual(['spot-1', 'spot-2'])
    expect(r.title).toBe('Smith & Vega — options')
  })
})

describe('bestLightWindow', () => {
  // Deterministic: fixed Tampa coords + fixed date; expectations derive from the
  // same computeSunTimes the app uses everywhere.
  const loc = { lat: 27.94, lng: -82.55 }
  const date = new Date('2026-07-04T16:00:00Z')
  const sun = computeSunTimes(date, loc.lat, loc.lng)
  const win = (light: Light) => bestLightWindow({ ...loc, bestLight: [light] }, date)

  it('maps sunset/evening-golden to the evening golden window', () => {
    expect(win('sunset')).toEqual({ label: 'Sunset', start: sun.goldenHourEvening.start, end: sun.goldenHourEvening.end })
    expect(win('evening-golden')).toEqual({ label: 'Evening golden hour', start: sun.goldenHourEvening.start, end: sun.goldenHourEvening.end })
  })

  it('maps sunrise/morning-golden to the morning golden window', () => {
    expect(win('sunrise')).toEqual({ label: 'Sunrise', start: sun.goldenHourMorning.start, end: sun.goldenHourMorning.end })
    expect(win('morning-golden')).toEqual({ label: 'Morning golden hour', start: sun.goldenHourMorning.start, end: sun.goldenHourMorning.end })
  })

  it('maps blue-hour to the evening blue window', () => {
    expect(win('blue-hour')).toEqual({ label: 'Blue hour', start: sun.blueHourEvening.start, end: sun.blueHourEvening.end })
  })

  it('maps night-astro to an open-ended after-dark window', () => {
    expect(win('night-astro')).toEqual({ label: 'After dark', start: sun.astronomicalDusk, end: null })
  })

  it('maps daytime and open-shade to flexible (no times)', () => {
    expect(win('daytime')).toEqual({ label: 'Daytime · flexible', start: null, end: null })
    expect(win('open-shade')).toEqual({ label: 'Open shade · flexible', start: null, end: null })
  })

  it('uses the FIRST bestLight entry (primary light) and survives an empty list', () => {
    expect(bestLightWindow({ ...loc, bestLight: ['sunset', 'blue-hour'] }, date).label).toBe('Sunset')
    expect(bestLightWindow({ ...loc, bestLight: [] }, date)).toEqual({ label: 'Flexible', start: null, end: null })
  })
})
