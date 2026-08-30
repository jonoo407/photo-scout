import type { LatLngBoundsLiteral } from 'leaflet'
import { CATEGORY_COLOR, type Spot } from '../../spots/types'
import { sunPathLines } from '../../astro/sun-path'
import type { HomeLocation } from '../../data/home.config'

/* The parts of the map lens that are decisions rather than drawing.
 *
 * MapView itself is a thin Leaflet binding — it needs a real layout engine, so
 * every unit test mocks it out and none of this logic was ever covered. Pulling
 * the geometry and styling out here makes the decisions testable while leaving
 * the L.* calls (which only a browser can meaningfully exercise) in the
 * component, where the Playwright map test drives them. */

export interface PinSpec {
  id: string
  lat: number
  lng: number
  tooltip: string
  /** circleMarker style — category colour on a white ring. */
  style: { radius: number; color: string; weight: number; fillColor: string; fillOpacity: number }
}

export interface SunLineSpec {
  kind: 'sunrise' | 'sunset'
  from: [number, number]
  to: [number, number]
  color: string
  /** e.g. "Sunset · 297°" */
  label: string
}

export const HOME_TOOLTIP = 'Home'
export const SUNRISE_COLOR = '#f2b43c'
export const SUNSET_COLOR = '#a8431d'

/** One pin per spot, in the order given. */
export function pinSpecs(spots: Spot[]): PinSpec[] {
  return spots.map((spot) => ({
    id: spot.id,
    lat: spot.lat,
    lng: spot.lng,
    tooltip: spot.name,
    style: {
      radius: 7,
      color: '#fff',
      weight: 1.5,
      fillColor: CATEGORY_COLOR[spot.category],
      fillOpacity: 1,
    },
  }))
}

/**
 * What the map should show when the pin set changes.
 *
 * With spots on screen the view fits them all plus home; with none — every
 * filter excluded everything — fitBounds on a single point would zoom to
 * street level, so home gets a sensible city zoom instead.
 */
export function viewForPins(
  spots: Spot[], home: HomeLocation,
): { kind: 'bounds'; bounds: LatLngBoundsLiteral; pad: number } | { kind: 'center'; center: [number, number]; zoom: number } {
  if (!spots.length) return { kind: 'center', center: [home.lat, home.lng], zoom: 11 }
  return {
    kind: 'bounds',
    bounds: [[home.lat, home.lng], ...spots.map((s) => [s.lat, s.lng] as [number, number])],
    pad: 0.12,
  }
}

/** The PhotoPills-style sunrise/sunset lines radiating from a spot. */
export function sunLineSpecs(lat: number, lng: number, date: Date): SunLineSpec[] {
  const { sunrise, sunset } = sunPathLines(lat, lng, date)
  const specs: SunLineSpec[] = []
  const push = (line: typeof sunrise, kind: SunLineSpec['kind'], color: string, label: string) => {
    // Polar latitudes have days with no sunrise or no sunset at all.
    if (!line) return
    specs.push({
      kind,
      from: [lat, lng],
      to: [line.to.lat, line.to.lng],
      color,
      label: `${label} · ${Math.round(line.bearing)}°`,
    })
  }
  push(sunrise, 'sunrise', SUNRISE_COLOR, 'Sunrise')
  push(sunset, 'sunset', SUNSET_COLOR, 'Sunset')
  return specs
}

/**
 * Whether the floating card should close because its spot left the filtered
 * set. Selecting a spot and then filtering it away must not leave a card for
 * something the map no longer shows.
 */
export function keepSelection(selected: Spot | null, spots: Spot[]): boolean {
  return !!selected && spots.some((s) => s.id === selected.id)
}
