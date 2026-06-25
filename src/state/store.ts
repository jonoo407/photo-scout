import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Category, Light } from '../spots/types'
import { DEFAULT_HOME, type HomeLocation } from '../data/home.config'

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
  maxDriveMin: null,
  sort: 'nearest',
}

interface AppState {
  wishlist: string[]
  visited: string[]
  checklist: Record<string, string[]>
  filters: Filters
  home: HomeLocation
  units: 'imperial' | 'metric'
  mapsApp: 'apple' | 'google'
  theme: ThemeChoice

  toggleWishlist: (id: string) => void
  toggleVisited: (id: string) => void
  toggleShot: (spotId: string, shotId: string) => void
  setFilters: (patch: Partial<Filters>) => void
  resetFilters: () => void
  setHome: (home: HomeLocation) => void
  setUnits: (u: 'imperial' | 'metric') => void
  setMapsApp: (m: 'apple' | 'google') => void
  setTheme: (t: ThemeChoice) => void
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
  return home
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      wishlist: [],
      visited: [],
      checklist: {},
      filters: EMPTY_FILTERS,
      home: DEFAULT_HOME,
      units: 'imperial',
      mapsApp: 'apple',
      theme: 'auto',

      toggleWishlist: (id) => set((s) => ({ wishlist: toggle(s.wishlist, id) })),
      toggleVisited: (id) => set((s) => ({ visited: toggle(s.visited, id) })),
      toggleShot: (spotId, shotId) =>
        set((s) => ({ checklist: { ...s.checklist, [spotId]: toggle(s.checklist[spotId] ?? [], shotId) } })),
      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: EMPTY_FILTERS }),
      setHome: (home) => set({ home }),
      setUnits: (units) => set({ units }),
      setMapsApp: (mapsApp) => set({ mapsApp }),
      setTheme: (theme) => { applyTheme(theme); set({ theme }) },
    }),
    {
      name: 'photo-scout',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persisted: unknown) => {
        const s = persisted as AppState | undefined
        if (s && typeof s === 'object') s.home = healStaleHome(s.home)
        return s as AppState
      },
    },
  ),
)
