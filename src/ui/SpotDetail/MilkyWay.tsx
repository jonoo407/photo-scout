import { useMemo } from 'react'
import { IconMoonStars } from '@tabler/icons-react'
import type { Spot } from '../../spots/types'
import { nextCoreWindow } from '../../astro/milky-way'
import { getRegion } from '../../data/regions'
import { fmtDay, fmtRange, fmtTime } from '../../util/format'

const compass = (az: number) => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(az / 45) % 8]
}

/* Galactic-core planner for night-astro spots: tonight's shooting window in
   season, or the date the core season reopens. */
export default function MilkyWay({ spot, from }: { spot: Spot; from?: Date }) {
  const astro = spot.bestLight.includes('night-astro')
  const tz = getRegion(spot.region).timeZone
  const next = useMemo(
    () => (astro ? nextCoreWindow(from ?? new Date(), spot.lat, spot.lng, tz) : null),
    [astro, from, spot.lat, spot.lng, tz],
  )

  if (!astro || !next) return null
  const { window: w, nightsAway } = next
  const moonBad = w.moonUp && w.moonIllumination >= 30

  return (
    <>
      <h3 className="h3">Milky Way core</h3>
      <div className="card list">
        {nightsAway === 0 ? (
          <div className="row" style={{ alignItems: 'center' }}>
            <span className="rowleft" style={{ alignItems: 'center', gap: 8 }}>
              <IconMoonStars size={16} color="var(--gold)" />
              <span style={{ fontWeight: 500 }}>Tonight · {fmtRange(w.start, w.end, tz)}</span>
            </span>
            <span className="small tertiary">peaks {w.peakAltitude}° {compass(w.peakAzimuth)} at {fmtTime(w.peak, tz)}</span>
          </div>
        ) : (
          <div className="row" style={{ alignItems: 'center' }}>
            <span className="rowleft" style={{ alignItems: 'center', gap: 8 }}>
              <IconMoonStars size={16} color="var(--gold)" />
              <span style={{ fontWeight: 500 }}>Next core window · {fmtDay(w.start, tz)}</span>
            </span>
            <span className="small tertiary">{fmtRange(w.start, w.end, tz)}</span>
          </div>
        )}
        <p className={`small ${moonBad ? '' : 'tertiary'}`} style={{ margin: '4px 0 0', color: moonBad ? 'var(--skip-ink)' : undefined }}>
          {moonBad
            ? `${w.moonIllumination}% moon is up — the core will be washed out; aim for a darker night`
            : w.moonUp
              ? `${w.moonIllumination}% moon up — thin enough to keep shooting`
              : `${w.moonIllumination}% moon, below the horizon — dark skies`}
        </p>
      </div>
    </>
  )
}
