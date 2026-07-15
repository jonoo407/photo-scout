import { lazy, Suspense, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconSearch, IconStar, IconMoodEmpty, IconCar, IconPointFilled, IconX, IconChevronRight, IconPaw } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { authAvailable } from '../../auth/supabase'
import { useRegion, useRegionSpots } from '../../state/useRegion'
import { CATEGORIES, CATEGORY_LABEL, type Category, type Light } from '../../spots/types'
import { liveOpen, milesFromHome, driveMinutes } from '../../spots/live'
import { passesFilters, LIGHT_BUCKETS, bucketFilterPatch, activeBucketId } from '../../spots/filter'
import { fmtTime, fmtDrive } from '../../util/format'
import { SpotCard, type Badge } from '../SpotCard'

// Leaflet is ~150KB — load the map lens only when it's opened.
const MapView = lazy(() => import('./MapView'))

const LIGHT_LABEL: Record<Light, string> = {
  sunrise: 'Sunrise', 'morning-golden': 'Morning golden', 'blue-hour': 'Blue hour',
  daytime: 'Daytime', 'evening-golden': 'Evening golden', sunset: 'Sunset',
  'night-astro': 'Night', 'open-shade': 'Open shade',
}

const VIEW_KEY = 'explore-view'

/* Explore (IA redesign 1e/1f): one finding task, two lenses. Browse's full
   filter set + Plan's spots-by-light buckets, with the map one segmented
   control away. */
export default function ExploreScreen() {
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const view: 'list' | 'map' = params.get('view') === 'map' ? 'map' : 'list'
  const filters = useStore((s) => s.filters)
  const setFilters = useStore((s) => s.setFilters)
  const resetFilters = useStore((s) => s.resetFilters)
  const home = useStore((s) => s.home)
  const region = useRegion()
  const tz = region.timeZone
  const { spots } = useRegionSpots()
  const wishlistArr = useStore((s) => s.wishlist)
  const wishlist = useMemo(() => new Set(wishlistArr), [wishlistArr])
  const now = useMemo(() => new Date(), [])

  // The lens choice sticks for the session; a bare /explore reopens the last one.
  useEffect(() => {
    if (!params.get('view') && sessionStorage.getItem(VIEW_KEY) === 'map') {
      setParams({ view: 'map' }, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const setView = (v: 'list' | 'map') => {
    sessionStorage.setItem(VIEW_KEY, v)
    setParams(v === 'map' ? { view: 'map' } : {}, { replace: true })
  }

  const rows = useMemo(() => {
    const enriched = spots.map((spot) => ({
      spot,
      open: liveOpen(spot, now, home.lat, home.lng),
      miles: milesFromHome(spot, home),
      drive: driveMinutes(spot, home),
    }))
    let out = enriched.filter(({ spot, open, drive }) =>
      passesFilters(spot, filters, { openState: open.state, driveMin: drive, inWishlist: wishlist.has(spot.id) }))
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

  const activeBucket = activeBucketId(filters)
  const toggleBucket = (id: (typeof LIGHT_BUCKETS)[number]['id']) => {
    const bucket = LIGHT_BUCKETS.find((b) => b.id === id)!
    if (activeBucket === id) setFilters({ lights: [], darkSkyOnly: false })
    else setFilters(bucketFilterPatch(bucket))
  }

  // The pet chip appears only once a region has verified pet data (B16).
  const hasPetData = spots.some((s) => s.petFriendly !== undefined)

  const active = Boolean(
    filters.query || filters.categories.length || filters.openNow || filters.freeOnly ||
    filters.wishlistOnly || filters.darkSkyOnly || filters.petFriendlyOnly ||
    filters.maxDriveMin != null || filters.lights.length,
  )

  const badgeFor = (state: string): Badge =>
    state === 'open' ? { label: 'Open', kind: 'open' }
      : state === 'tour-only' ? { label: 'Tour only', kind: 'info' }
        : state === 'call-ahead' ? { label: 'Call ahead', kind: 'info' }
          : { label: 'Closed', kind: 'closed' }

  return (
    <div className="screen">
      <div className="row-spread" style={{ margin: '4px 0 12px' }}>
        <h1 style={{ margin: 0 }}>Explore</h1>
        <div className="segmented" role="group" aria-label="View">
          <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>List</button>
          <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}>Map</button>
        </div>
      </div>

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
        {hasPetData && (
          <button className={`chip ${filters.petFriendlyOnly ? 'on' : ''}`} onClick={() => setFilters({ petFriendlyOnly: !filters.petFriendlyOnly })}>
            <IconPaw size={13} /> Pet-friendly
          </button>
        )}
        <button className="chip" onClick={() => setFilters({ sort: filters.sort === 'nearest' ? 'az' : filters.sort === 'az' ? 'category' : 'nearest' })}>
          Sort: {filters.sort === 'nearest' ? 'Nearest' : filters.sort === 'az' ? 'A–Z' : 'Category'}
        </button>
        {activeBucket === null && filters.lights.map((l) => (
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

      <p className="shdr" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        BEST IN THE LIGHT <span className="pill info" style={{ letterSpacing: 0, whiteSpace: 'nowrap' }}>from Plan</span>
      </p>
      <div className="chiprow" style={{ marginBottom: 12 }}>
        {LIGHT_BUCKETS.map((b) => (
          <button key={b.id} className={`chip ${activeBucket === b.id ? 'on' : ''}`} onClick={() => toggleBucket(b.id)}>
            {b.label}
          </button>
        ))}
      </div>

      {view === 'map' ? (
        <Suspense fallback={<p className="center-note">Loading map…</p>}>
          <MapView spots={rows.map((r) => r.spot)} />
        </Suspense>
      ) : (
        <>
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
              <button className="linkrow" style={{ marginTop: 12, color: 'var(--terracotta)' }} onClick={() => nav('/community')}>
                <span>Missing a whole city? Vote on where Vantage goes next</span>
                <IconChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rows.map(({ spot, open, drive }) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  badge={badgeFor(open.state)}
                  reason={`${CATEGORY_LABEL[spot.category]} · ${spot.isFree ? 'Free' : `$${spot.feeUSD}`} · ${spot.city}`}
                  meta={<><span><IconCar size={14} /> {fmtDrive(drive)}</span>{open.state === 'open' && <span style={{ color: 'var(--go-ink)' }}><IconPointFilled size={12} /> {open.allDay ? 'Open 24h' : `till ${fmtTime(open.closesAt, tz)}`}</span>}</>}
                />
              ))}
            </div>
          )}

          {authAvailable() && (
            <button className="linkrow" style={{ marginTop: 12 }} onClick={() => nav('/suggest')}>
              <span>Know a spot we're missing? Suggest it</span>
              <IconChevronRight size={16} color="var(--ink-3)" />
            </button>
          )}
        </>
      )}
    </div>
  )
}
