/* Default home origin: 3812 W Leona St, Tampa FL (Palma Ceia, South Tampa),
   geocoded via OpenStreetMap. Swappable in Settings; the app recomputes drive
   times + Next Up from whatever the user pins. `address`, when set, is used as
   the directions origin so the maps app routes from the real street address
   instead of a coordinate that can reverse-geocode to a neighbor. */
export interface HomeLocation {
  label: string
  address?: string
  lat: number
  lng: number
  coordsNeedVerify?: boolean
}

export const DEFAULT_HOME: HomeLocation = {
  label: '3812 W Leona St, Tampa',
  address: '3812 W Leona St, Tampa, FL 33629',
  lat: 27.9147,
  lng: -82.5064,
}
