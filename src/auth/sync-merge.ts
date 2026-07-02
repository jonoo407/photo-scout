import type { HomeLocation } from '../data/home.config'
import type { RegionId } from '../data/regions'
import type { ThemeChoice } from '../state/store'

/* The slice of app state that follows a signed-in user across devices.
   Transient UI (filters, sheets) stays local by design. */
export interface SyncedState {
  wishlist: string[]
  visited: string[]
  checklist: Record<string, string[]>
  home: HomeLocation
  region: RegionId
  units: 'imperial' | 'metric'
  mapsApp: 'apple' | 'google'
  theme: ThemeChoice
}

const union = (a: string[], b: string[]) => [...a, ...b.filter((x) => !a.includes(x))]

/**
 * Reconcile local device state with the account's synced state at sign-in.
 * Lists union (nothing saved on any device is ever lost); scalars take the
 * remote value (the account is the source of truth for prefs). No remote row
 * yet → the local state passes through as the first push.
 */
export function mergeState(local: SyncedState, remote: SyncedState | null): SyncedState {
  if (!remote) return local
  const checklist: Record<string, string[]> = { ...remote.checklist }
  for (const [spot, shots] of Object.entries(local.checklist)) {
    checklist[spot] = union(shots, remote.checklist[spot] ?? [])
  }
  return {
    wishlist: union(local.wishlist, remote.wishlist),
    visited: union(local.visited, remote.visited),
    checklist,
    home: remote.home,
    region: remote.region,
    units: remote.units,
    mapsApp: remote.mapsApp,
    theme: remote.theme,
  }
}

/** Extract exactly the synced fields from the (wider) store state. */
export function syncableSlice(s: SyncedState): SyncedState {
  return {
    wishlist: s.wishlist,
    visited: s.visited,
    checklist: s.checklist,
    home: s.home,
    region: s.region,
    units: s.units,
    mapsApp: s.mapsApp,
    theme: s.theme,
  }
}
