import { computeSunTimes } from '../astro/sun-times'
import type { Light } from './types'

/* Client shoot shortlist (v1, no backend): a photographer picks a few candidate
   spots and sends the client ONE link — spot ids ride in the URL itself:
   https://shootvantage.com/#/list?spots=a,b,c&title=Smith+family
   The /list page renders them client-facing (no app chrome). */

export const MAX_SHORTLIST = 10
const LIST_BASE = 'https://shootvantage.com/#/list'

export interface Shortlist {
  ids: string[]
  title: string | null
}

/** Parse a shortlist link's query (string or URLSearchParams). Trims, dedupes,
 *  drops empties, and caps at MAX_SHORTLIST so a mangled link can't explode the page. */
export function parseShortlist(search: string | URLSearchParams): Shortlist {
  const params = typeof search === 'string'
    ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    : search
  const ids: string[] = []
  for (const raw of (params.get('spots') ?? '').split(',')) {
    const id = raw.trim()
    if (id && !ids.includes(id)) ids.push(id)
    if (ids.length === MAX_SHORTLIST) break
  }
  const title = params.get('title')?.trim() || null
  return { ids, title }
}

/** Canonical share URL. Commas stay readable — they're the one separator this format promises. */
export function shortlistUrl(ids: string[], title?: string | null): string {
  const p = new URLSearchParams()
  p.set('spots', ids.join(','))
  const t = title?.trim()
  if (t) p.set('title', t)
  return `${LIST_BASE}?${p.toString().replace(/%2C/g, ',')}`
}

export interface LightWindow {
  label: string
  start: Date | null // null → no fixed clock window (flexible light)
  end: Date | null // null with a start → open-ended (after dark)
}

/** The concrete "come at this time" window for a spot's PRIMARY light
 *  (bestLight[0]), computed for the given date at the spot's own coords. */
export function bestLightWindow(
  spot: { lat: number; lng: number; bestLight: Light[] },
  date: Date,
): LightWindow {
  const primary = spot.bestLight[0]
  if (!primary) return { label: 'Flexible', start: null, end: null }
  if (primary === 'daytime') return { label: 'Daytime · flexible', start: null, end: null }
  if (primary === 'open-shade') return { label: 'Open shade · flexible', start: null, end: null }
  const sun = computeSunTimes(date, spot.lat, spot.lng)
  switch (primary) {
    case 'sunrise':
      return { label: 'Sunrise', start: sun.goldenHourMorning.start, end: sun.goldenHourMorning.end }
    case 'morning-golden':
      return { label: 'Morning golden hour', start: sun.goldenHourMorning.start, end: sun.goldenHourMorning.end }
    case 'evening-golden':
      return { label: 'Evening golden hour', start: sun.goldenHourEvening.start, end: sun.goldenHourEvening.end }
    case 'sunset':
      return { label: 'Sunset', start: sun.goldenHourEvening.start, end: sun.goldenHourEvening.end }
    case 'blue-hour':
      return { label: 'Blue hour', start: sun.blueHourEvening.start, end: sun.blueHourEvening.end }
    case 'night-astro':
      return { label: 'After dark', start: sun.astronomicalDusk, end: null }
  }
}
