/* Default home origin. Geocoded approximately from 3812 W Leona St, Tampa FL
   (South Tampa, near Bayshore). Swappable in Settings; the app recomputes drive
   times + Next Up from whatever the user pins. coordsNeedVerify until confirmed. */
export interface HomeLocation {
  label: string
  lat: number
  lng: number
  coordsNeedVerify?: boolean
}

export const DEFAULT_HOME: HomeLocation = {
  label: '3812 W Leona St, Tampa',
  lat: 27.8916,
  lng: -82.4843,
  coordsNeedVerify: true,
}
