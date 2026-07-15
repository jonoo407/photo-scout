import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Category, Light } from '../spots/types'
import type { BlockKey } from '../spots/day-plan'
import { POINT_VALUES, type PointEvent, type PointReason } from '../craft/points'
import { DEFAULT_HOME, type HomeLocation } from '../data/home.config'
import { DEFAULT_REGION, REGIONS, regionContains, type RegionId } from '../data/regions'

/** A saved day plan — the decomposed form of a /#/day?date=…&stops=… link. */
export interface SavedPlan {
  id: string
  name: string
  date: string // YYYY-MM-DD
  stops: Array<{ block: BlockKey; spotId: string }>
  createdAt: string
}

export type SortKey = 'nearest' | 'az' | 'category'
export type ThemeChoice = 'auto' | 'light' | 'dark'

/* Apply a theme by setting (or clearing) data-theme on <html>. "auto" removes
   the attribute so prefers-color-scheme decides. theme.css keys off this. */
export function applyTheme(theme: ThemeChoice) {
  const el = document.documentElement
  if (theme === 'auto') el.removeAttribute('data-theme')
  else el.setAttribute('data-theme', theme)
}

export interface Filters {
  query: string
  categories: Category[]
  lights: Light[]
  openNow: boolean
  freeOnly: boolean
  wishlistOnly: boolean
  /** Genuinely dark skies only (Milky Way work) — Explore's Dark sky bucket. */
  darkSkyOnly: boolean
  /** Leashed-pets-welcome spots only (B16). */
  petFriendlyOnly: boolean
  maxDriveMin: number | null
  sort: SortKey
}

export const EMPTY_FILTERS: Filters = {
  query: '',
  categories: [],
  lights: [],
  openNow: false,
  freeOnly: false,
  wishlistOnly: false,
  darkSkyOnly: false,
  petFriendlyOnly: false,
  maxDriveMin: null,
  sort: 'nearest',
}

interface AppState {
  wishlist: string[]
  visited: string[]
  checklist: Record<string, string[]>
  /** Private per-spot notes (gate codes, angles, contacts) — synced, never
      shown to clients (shortlist notes are a separate, deliberate field). */
  spotNotes: Record<string, string>
  /** Saved day plans, newest first — synced. */
  savedPlans: SavedPlan[]
  /** Craft-ladder point ledger, append-only — synced (union by id). */
  pointEvents: PointEvent[]
  filters: Filters
  home: HomeLocation
  region: RegionId
  units: 'imperial' | 'metric'
  mapsApp: 'apple' | 'google'
  theme: ThemeChoice
  introSeen: boolean
  /** When the photographer last viewed the Client lists section (ISO). */
  listsSeenAt: string | null
  /** Transient: a client response arrived since listsSeenAt (Saved-tab dot). */
  newClientResponse: boolean

  toggleWishlist: (id: string) => void
  toggleVisited: (id: string) => void
  toggleShot: (spotId: string, shotId: string) => void
  setSpotNote: (spotId: string, note: string) => void
  savePlan: (plan: Omit<SavedPlan, 'id' | 'createdAt'>) => string
  deletePlan: (id: string) => void
  awardPoints: (reason: PointReason) => void
  setFilters: (patch: Partial<Filters>) => void
  resetFilters: () => void
  setHome: (home: HomeLocation) => void
  setUnits: (u: 'imperial' | 'metric') => void
  setMapsApp: (m: 'apple' | 'google') => void
  setTheme: (t: ThemeChoice) => void
  setRegion: (r: RegionId) => void
  dismissIntro: () => void
  markListsSeen: () => void
  setNewClientResponse: (v: boolean) => void
}

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id]

/**
 * The seeded default home originally shipped with approximate coords (which
 * reverse-geocoded to a neighbor ~1.5mi away) and no `address`. A persisted
 * copy of that stale home overrides the corrected default on rehydrate, so we
 * heal it: any non-"Current location" home without an address predates the fix
 * (there's no custom-address entry UI) and is reset to the corrected default.
 * "Current location" homes (real GPS coords) and already-fixed homes are kept.
 */
export function healStaleHome(home: HomeLocation | undefined): HomeLocation {
  if (!home) return DEFAULT_HOME
  if (home.label !== 'Current location' && !home.address) return DEFAULT_HOME
  // The pre-2026-07 default was a personal street address; migrate any
  // persisted copy of it to the neutral downtown default.
  if (/Leona/i.test(home.address ?? '') || /Leona/i.test(home.label)) return DEFAULT_HOME
  return home
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      wishlist: [],
      visited: [],
      checklist: {},
      spotNotes: {},
      savedPlans: [],
      pointEvents: [],
      filters: EMPTY_FILTERS,
      home: DEFAULT_HOME,
      region: 'tampa-bay',
      units: 'imperial',
      mapsApp: 'apple',
      theme: 'auto',
      introSeen: false,
      listsSeenAt: null,
      newClientResponse: false,

      toggleWishlist: (id) => set((s) => ({ wishlist: toggle(s.wishlist, id) })),
      toggleVisited: (id) => set((s) => ({ visited: toggle(s.visited, id) })),
      toggleShot: (spotId, shotId) =>
        set((s) => ({ checklist: { ...s.checklist, [spotId]: toggle(s.checklist[spotId] ?? [], shotId) } })),
      setSpotNote: (spotId, note) =>
        set((s) => {
          const spotNotes = { ...s.spotNotes }
          const trimmed = note.trim()
          if (trimmed) spotNotes[spotId] = trimmed
          else delete spotNotes[spotId]
          return { spotNotes }
        }),
      savePlan: (plan) => {
        const id = crypto.randomUUID()
        set((s) => ({
          savedPlans: [
            { ...plan, id, createdAt: new Date().toISOString() },
            ...s.savedPlans,
          ].slice(0, 50), // sanity cap
        }))
        return id
      },
      deletePlan: (id) => set((s) => ({ savedPlans: s.savedPlans.filter((p) => p.id !== id) })),
      awardPoints: (reason) =>
        set((s) => ({
          pointEvents: [
            ...s.pointEvents,
            { id: crypto.randomUUID(), at: new Date().toISOString(), reason, pts: POINT_VALUES[reason] },
          ],
        })),
      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: EMPTY_FILTERS }),
      setHome: (home) => set({ home }),
      setUnits: (units) => set({ units }),
      setMapsApp: (mapsApp) => set({ mapsApp }),
      setTheme: (theme) => { applyTheme(theme); set({ theme }) },
      // Switch city; move home to the new region's default unless the current
      // home is already in that region (user's own in-city pin is kept).
      // Unknown ids (stale persisted value, removed city) fall back to default.
      setRegion: (region) => set((s) => {
        const r = REGIONS[region] ?? REGIONS[DEFAULT_REGION]
        const id = REGIONS[region] ? region : DEFAULT_REGION
        return { region: id, home: regionContains(r, s.home.lat, s.home.lng) ? s.home : r.defaultHome }
      }),
      dismissIntro: () => set({ introSeen: true }),
      markListsSeen: () => set({ listsSeenAt: new Date().toISOString(), newClientResponse: false }),
      setNewClientResponse: (newClientResponse) => set({ newClientResponse }),
    }),
    {
      name: 'photo-scout',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Filters (search text, chips, sort) are transient session UI — persisting
      // them meant a days-old "Sunset" filter still narrowed Browse on relaunch.
      // The new-response dot is recomputed from the server at each app open.
      partialize: (s) => {
        const { filters: _filters, newClientResponse: _dot, ...rest } = s
        return rest
      },
      migrate: (persisted: unknown) => {
        const s = persisted as AppState | undefined
        if (s && typeof s === 'object') s.home = healStaleHome(s.home)
        return s as AppState
      },
    },
  ),
)
