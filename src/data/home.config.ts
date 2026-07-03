/* Default home origin: a neutral public downtown point — never a personal
   address (the original default shipped the developer's street address to
   every user). Swappable in Settings; the app recomputes drive times + Next Up
   from whatever the user pins. `address`, when set, is used as the directions
   origin so the maps app routes from a real address instead of a coordinate
   that can reverse-geocode to a neighbor. */
export interface HomeLocation {
  label: string
  address?: string
  lat: number
  lng: number
  coordsNeedVerify?: boolean
}

export const DEFAULT_HOME: HomeLocation = {
  label: 'Downtown Tampa',
  address: 'Downtown Tampa, Tampa, FL',
  lat: 27.9477,
  lng: -82.4584,
}
