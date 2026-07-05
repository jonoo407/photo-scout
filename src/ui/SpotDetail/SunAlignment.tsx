import { useMemo } from 'react'
import { IconSunset2, IconSunrise } from '@tabler/icons-react'
import type { Spot } from '../../spots/types'
import { sunAlignmentDates } from '../../spots/sun-align'
import { getRegion } from '../../data/regions'
import { fmtDay } from '../../util/format'

/* "Sun-behind-X": the next dates the rising/setting sun lines up (±2°) with
   the bearing this spot is shot toward — the henge scorer, generalized. */
export default function SunAlignment({ spot, from }: { spot: Spot; from?: Date }) {
  const tz = getRegion(spot.region).timeZone
  const hits = useMemo(
    () => (spot.facing == null ? [] : sunAlignmentDates(spot.facing, spot.lat, spot.lng, tz, from ?? new Date())),
    [spot.facing, spot.lat, spot.lng, tz, from],
  )

  if (!hits.length) return null

  return (
    <>
      <h3 className="h3">Sun-behind-the-subject dates</h3>
      <div className="card list">
        {hits.map((h) => (
          <div key={h.at.toISOString()} className="row" style={{ alignItems: 'center' }}>
            <span className="rowleft" style={{ alignItems: 'center', gap: 8 }}>
              {h.kind === 'sunset'
                ? <IconSunset2 size={16} color="var(--terracotta)" />
                : <IconSunrise size={16} color="var(--gold)" />}
              <span style={{ fontWeight: 500 }}>{fmtDay(h.at, tz)}</span>
            </span>
            <span className="small tertiary">
              {h.kind} at {Math.round(h.bearing)}° · {h.delta < 1 ? 'dead on' : `±${Math.round(h.delta)}°`}
            </span>
          </div>
        ))}
      </div>
      <p className="small tertiary" style={{ margin: '6px 2px 0', lineHeight: 1.5 }}>
        The sun {hits[0].kind === 'sunset' ? 'sets' : 'rises'} within 2° of this spot's shooting line on these dates — henge light.
      </p>
    </>
  )
}
