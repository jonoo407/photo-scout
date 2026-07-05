import { useEffect, useMemo, useState } from 'react'
import { IconCompass, IconArrowUp } from '@tabler/icons-react'
import type { Spot } from '../../spots/types'
import { signedDelta, headingFromEvent, sunTarget, type OrientationReading } from '../../spots/compass'
import { getRegion } from '../../data/regions'
import { fmtTime } from '../../util/format'

const compassName = (az: number) => {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(az / 22.5) % 16]
}

/* Web-AR-lite: an arrow that physically points at where the sun will sit
   during this spot's prime light window. Uses the device compass when one is
   available; otherwise it degrades to bearing + clock-time guidance. */
export default function CompassMode({ spot, from }: { spot: Spot; from?: Date }) {
  const [open, setOpen] = useState(false)
  const [heading, setHeading] = useState<number | null>(null)
  const tz = getRegion(spot.region).timeZone
  const target = useMemo(() => sunTarget(spot, from ?? new Date()), [spot, from])

  useEffect(() => {
    if (!open) return
    const onOrient = (e: Event) => {
      const h = headingFromEvent(e as unknown as OrientationReading)
      if (h != null) setHeading(h)
    }
    // Android fires absolute readings on its own event; iOS uses the base one.
    window.addEventListener('deviceorientationabsolute', onOrient)
    window.addEventListener('deviceorientation', onOrient)
    return () => {
      window.removeEventListener('deviceorientationabsolute', onOrient)
      window.removeEventListener('deviceorientation', onOrient)
    }
  }, [open])

  const expand = async () => {
    // iOS 13+ requires an explicit grant, and only from a user gesture.
    const D = (globalThis as Record<string, unknown>).DeviceOrientationEvent as
      | { requestPermission?: () => Promise<string> }
      | undefined
    try { await D?.requestPermission?.() } catch { /* declined → fallback text */ }
    setOpen((o) => !o)
  }

  if (!open) {
    return (
      <button className="chip" onClick={() => void expand()}>
        <IconCompass size={14} /> Compass to the light
      </button>
    )
  }

  const delta = heading == null ? 0 : signedDelta(heading, target.bearing)

  return (
    <div className="card compasscard">
      <div className="row-spread" style={{ alignItems: 'center' }}>
        <p className="small" style={{ margin: 0, fontWeight: 500 }}>
          Sun at {fmtTime(target.at, tz)}{target.daysAhead > 0 ? ' tomorrow' : ''} · {Math.round(target.bearing)}° {compassName(target.bearing)}
        </p>
        <button className="chip" onClick={() => setOpen(false)}>Close</button>
      </div>
      <div className="compassdial">
        <div
          data-testid="compass-arrow"
          className="compassarrow"
          style={{ transform: `rotate(${delta}deg)`, opacity: heading == null ? 0.35 : 1 }}
        >
          <IconArrowUp size={44} />
        </div>
      </div>
      <p className="small tertiary" style={{ margin: 0, textAlign: 'center' }}>
        {heading == null
          ? 'Point your phone around to wake the compass — or just face ' +
            `${compassName(target.bearing)} (${Math.round(target.bearing)}°).`
          : `You're facing ${Math.round(heading)}° ${compassName(heading)} — ` +
            (Math.abs(delta) <= 8 ? 'the sun will be dead ahead.' : `turn ${Math.abs(Math.round(delta))}° ${delta > 0 ? 'right' : 'left'}.`)}
      </p>
    </div>
  )
}
