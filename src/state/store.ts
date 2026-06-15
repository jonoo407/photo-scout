import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Category, Light } from '../spots/types'
import { DEFAULT_HOME, type HomeLocation } from '../data/home.config'

export type SortKey = 'nearest' | 'az' | 'category'

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

  toggleWishlist: (id: string) => void
  toggleVisited: (id: string) => void
  toggleShot: (spotId: string, shotId: string) => void
  setFilters: (patch: Partial<Filters>) => void
  resetFilters: () => void
  setHome: (home: HomeLocation) => void
  setUnits: (u: 'imperial' | 'metric') => void
  setMapsApp: (m: 'apple' | 'google') => void
}

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id]

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

      toggleWishlist: (id) => set((s) => ({ wishlist: toggle(s.wishlist, id) })),
      toggleVisited: (id) => set((s) => ({ visited: toggle(s.visited, id) })),
      toggleShot: (spotId, shotId) =>
        set((s) => ({ checklist: { ...s.checklist, [spotId]: toggle(s.checklist[spotId] ?? [], shotId) } })),
      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: EMPTY_FILTERS }),
      setHome: (home) => set({ home }),
      setUnits: (units) => set({ units }),
      setMapsApp: (mapsApp) => set({ mapsApp }),
    }),
    { name: 'photo-scout', storage: createJSONStorage(() => localStorage) },
  ),
)
