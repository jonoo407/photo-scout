import type { HomeLocation } from '../data/home.config'
import type { RegionId } from '../data/regions'
import type { ThemeChoice, SavedPlan } from '../state/store'

/* The slice of app state that follows a signed-in user across devices.
   Transient UI (filters, sheets) stays local by design. */
export interface SyncedState {
  wishlist: string[]
  visited: string[]
  checklist: Record<string, string[]>
  /** Private per-spot notes. Older synced rows predate this field. */
  spotNotes?: Record<string, string>
  /** Saved day plans. Older synced rows predate this field. */
  savedPlans?: SavedPlan[]
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
    // Notes are content, not prefs: keep both sides; on a per-spot conflict
    // the device in hand wins (it holds whatever was just written).
    spotNotes: { ...(remote.spotNotes ?? {}), ...(local.spotNotes ?? {}) },
    // Plans union by id, same device-wins rule; newest-created first.
    savedPlans: [
      ...(local.savedPlans ?? []),
      ...(remote.savedPlans ?? []).filter((r) => !(local.savedPlans ?? []).some((l) => l.id === r.id)),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    // (2026-07-15) The short-lived client-side pointEvents ledger is gone:
    // points moved server-side (point_events table, RPC-minted) before any
    // client ever earned one. Stray pointEvents in old synced rows are
    // simply dropped by this slice.
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
    spotNotes: s.spotNotes ?? {},
    savedPlans: s.savedPlans ?? [],
    home: s.home,
    region: s.region,
    units: s.units,
    mapsApp: s.mapsApp,
    theme: s.theme,
  }
}
