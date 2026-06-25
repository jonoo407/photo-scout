import { computeSunTimes } from '../astro/sun-times'
import { sunPosition } from '../astro/sun-position'
import { classifyLightDirection, type LightDirection } from '../astro/sun-direction'
import { resolveOpenStatus, type OpenStatus } from './hours'
import { haversineMiles } from './distance'
import type { Spot } from './types'
import type { HomeLocation } from '../data/home.config'

export function sunTimesForFactory(lat: number, lng: number) {
  return (d: Date) => {
    const t = computeSunTimes(d, lat, lng)
    return { sunrise: t.sunrise, sunset: t.sunset }
  }
}

export function liveOpen(spot: Spot, now: Date, lat: number, lng: number): OpenStatus {
  return resolveOpenStatus(spot.hours, now, sunTimesForFactory(lat, lng))
}

export function milesFromHome(spot: Spot, home: HomeLocation): number {
  return haversineMiles(home, spot)
}

export function driveMinutes(spot: Spot, home: HomeLocation): number {
  return spot.driveMinutes ?? Math.round(milesFromHome(spot, home) * 2.2)
}

/** Light direction for a spot at a given moment (null if the spot has no facing). */
export function lightDirectionAt(spot: Spot, when: Date, lat: number, lng: number): LightDirection | null {
  if (spot.facing == null) return null
  const sun = sunPosition(when, lat, lng)
  if (sun.elevation < -1) return null
  return classifyLightDirection(sun.azimuth, spot.facing, sun.elevation)
}

export const DIRECTION_LABEL: Record<LightDirection, string> = {
  front: 'Front-lit',
  side: 'Side-lit',
  back: 'Backlit',
  silhouette: 'Silhouette',
}

export function directionsUrl(
  spot: Spot,
  home: HomeLocation,
  app: 'apple' | 'google',
): string {
  // Prefer the verified street address so the maps app routes to the right
  // building (raw coords can reverse-geocode to a neighbor — e.g. St. Paul AME
  // landing on the Tampa Firefighters Museum). Fall back to coords if unset.
  const dest = spot.address ? encodeURIComponent(spot.address) : `${spot.lat},${spot.lng}`
  const origin = `${home.lat},${home.lng}`
  if (app === 'google') {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`
  }
  return `https://maps.apple.com/?saddr=${origin}&daddr=${dest}&dirflg=d`
}

export function placeUrl(lat: number, lng: number, label: string, app: 'apple' | 'google'): string {
  if (app === 'google') return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  return `https://maps.apple.com/?q=${encodeURIComponent(label)}&ll=${lat},${lng}`
}
