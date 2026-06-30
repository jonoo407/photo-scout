import { useMemo } from 'react'
import { IconSearch, IconStar, IconMoodEmpty, IconCar, IconPointFilled, IconX } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { useRegion, useRegionSpots } from '../../state/useRegion'
import { CATEGORIES, CATEGORY_LABEL, type Category, type Light } from '../../spots/types'
import { liveOpen, milesFromHome, driveMinutes } from '../../spots/live'
import { matchesLight } from '../../spots/next-up'
import { fmtTime } from '../../util/format'
import { SpotCard, type Badge } from '../SpotCard'

const LIGHT_LABEL: Record<Light, string> = {
  sunrise: 'Sunrise', 'morning-golden': 'Morning golden', 'blue-hour': 'Blue hour',
  daytime: 'Daytime', 'evening-golden': 'Evening golden', sunset: 'Sunset',
  'night-astro': 'Night', 'open-shade': 'Open shade',
}

export default function BrowseScreen() {
  const filters = useStore((s) => s.filters)
  const setFilters = useStore((s) => s.setFilters)
  const resetFilters = useStore((s) => s.resetFilters)
  const home = useStore((s) => s.home)
  const region = useRegion()
  const spots = useRegionSpots()
  const wishlistArr = useStore((s) => s.wishlist)
  const wishlist = useMemo(() => new Set(wishlistArr), [wishlistArr])
  const now = useMemo(() => new Date(), [])

  const rows = useMemo(() => {
    const enriched = spots.map((spot) => ({
      spot,
      open: liveOpen(spot, now, home.lat, home.lng),
      miles: milesFromHome(spot, home),
      drive: driveMinutes(spot, home),
    }))
    const q = filters.query.trim().toLowerCase()
    let out = enriched.filter(({ spot, open, drive }) => {
      if (q && !(`${spot.name} ${spot.city} ${spot.bestFor.join(' ')}`.toLowerCase().includes(q))) return false
      if (filters.categories.length && !filters.categories.includes(spot.category)) return false
      if (filters.openNow && open.state !== 'open') return false
      if (filters.freeOnly && !spot.isFree) return false
      if (filters.wishlistOnly && !wishlist.has(spot.id)) return false
      if (filters.maxDriveMin != null && drive > filters.maxDriveMin) return false
      if (filters.lights.length && !filters.lights.some((l) => matchesLight(spot, l))) return false
      return true
    })
    out = out.sort((a, b) => {
      const aw = wishlist.has(a.spot.id) ? 0 : 1
      const bw = wishlist.has(b.spot.id) ? 0 : 1
      if (aw !== bw) return aw - bw
      if (filters.sort === 'az') return a.spot.name.localeCompare(b.spot.name)
      if (filters.sort === 'category') return a.spot.category.localeCompare(b.spot.category)
      return a.miles - b.miles
    })
    return out
  }, [filters, home, wishlist, now, spots])

  const toggleCat = (c: Category) =>
    setFilters({ categories: filters.categories.includes(c) ? filters.categories.filter((x) => x !== c) : [...filters.categories, c] })

  const active = Boolean(
    filters.query || filters.categories.length || filters.openNow || filters.freeOnly ||
    filters.wishlistOnly || filters.maxDriveMin != null || filters.lights.length,
  )

  const badgeFor = (state: string): Badge =>
    state === 'open' ? { label: 'Open', kind: 'open' }
      : state === 'tour-only' ? { label: 'Tour only', kind: 'info' }
        : state === 'call-ahead' ? { label: 'Call ahead', kind: 'info' }
          : { label: 'Closed', kind: 'closed' }

  return (
    <div className="screen">
      <h1>Browse</h1>

      <label className="row" style={{ borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: 0, gap: 8, padding: '9px 12px', marginBottom: 12 }}>
        <IconSearch size={18} color="var(--ink-2)" />
        <input
          value={filters.query}
          onChange={(e) => setFilters({ query: e.target.value })}
          placeholder={`Search ${spots.length} ${region.label} spots…`}
          style={{ border: 0, background: 'transparent', outline: 'none', font: 'inherit', fontSize: 14, color: 'var(--ink)', width: '100%' }}
        />
      </label>

      <p className="shdr">CATEGORY</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip ${filters.categories.includes(c) ? 'on' : ''}`} onClick={() => toggleCat(c)}>
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        <button className={`chip ${filters.openNow ? 'on' : ''}`} onClick={() => setFilters({ openNow: !filters.openNow })}>Open now</button>
        <button className={`chip ${filters.freeOnly ? 'on' : ''}`} onClick={() => setFilters({ freeOnly: !filters.freeOnly })}>Free</button>
        <button className={`chip ${filters.wishlistOnly ? 'on' : ''}`} onClick={() => setFilters({ wishlistOnly: !filters.wishlistOnly })}><IconStar size={13} /> Want to go</button>
        <button className="chip" onClick={() => setFilters({ sort: filters.sort === 'nearest' ? 'az' : filters.sort === 'az' ? 'category' : 'nearest' })}>
          Sort: {filters.sort === 'nearest' ? 'Nearest' : filters.sort === 'az' ? 'A–Z' : 'Category'}
        </button>
        {filters.lights.map((l) => (
          <button key={l} className="chip on" onClick={() => setFilters({ lights: filters.lights.filter((x) => x !== l) })}>
            {LIGHT_LABEL[l]} <IconX size={13} />
          </button>
        ))}
      </div>

      <p className="shdr">MAX DRIVE</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {([30, 60, 90] as const).map((m) => (
          <button
            key={m}
            className={`chip ${filters.maxDriveMin === m ? 'on' : ''}`}
            onClick={() => setFilters({ maxDriveMin: filters.maxDriveMin === m ? null : m })}
          >
            ≤{m} min
          </button>
        ))}
      </div>

      <div className="row-spread" style={{ margin: '0 2px 10px' }}>
        <span className="small tertiary">Showing {rows.length} of {spots.length}</span>
        {active && <button className="chip" onClick={resetFilters}>Clear all</button>}
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <IconMoodEmpty size={30} />
          <p className="et">No spots match these filters</p>
          <p className="es">Try removing a filter — open-now or max drive time.</p>
          <button className="chip" onClick={resetFilters}>Clear filters</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(({ spot, open, drive }) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              badge={badgeFor(open.state)}
              reason={`${CATEGORY_LABEL[spot.category]} · ${spot.isFree ? 'Free' : `$${spot.feeUSD}`} · ${spot.city}`}
              meta={<><span><IconCar size={14} /> {drive} min</span>{open.state === 'open' && <span style={{ color: 'var(--go-ink)' }}><IconPointFilled size={12} /> till {fmtTime(open.closesAt)}</span>}</>}
            />
          ))}
        </div>
      )}
    </div>
  )
}
