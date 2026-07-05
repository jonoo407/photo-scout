import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IconMapPin, IconSunset2 } from '@tabler/icons-react'
import { useAllSpots } from '../../state/useRegion'
import { parseShortlist, bestLightWindow } from '../../spots/shortlist'
import { fmtRange, fmtTime } from '../../util/format'
import { getRegion } from '../../data/regions'
import type { Spot } from '../../spots/types'

/* The page a photographer's CLIENT opens — deliberately chrome-free (no tab
   bar, no want/been buttons, no craft jargon). Just the options: photo, name,
   address, when the light is right, and why the spot. */
export default function ClientListScreen() {
  const [params] = useSearchParams()
  const { ids, title } = parseShortlist(params)
  const { spots: all, loading } = useAllSpots()
  const now = useMemo(() => new Date(), [])

  const byId = new Map(all.map((s) => [s.id, s]))
  const spots = ids.map((id) => byId.get(id)).filter(Boolean) as Spot[]

  if (loading && spots.length < ids.length) {
    return <div className="screen clientpage"><p className="center-note">Loading…</p></div>
  }

  return (
    <div className="screen clientpage">
      <header>
        <p className="clientbrand">Vantage</p>
        <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>{title ?? 'Location options'}</h1>
        {spots.length > 0 && (
          <p className="clientsub">
            {spots.length} location {spots.length === 1 ? 'option' : 'options'} for your shoot —
            tell your photographer which one you like.
          </p>
        )}
      </header>

      {spots.length === 0 && (
        <div className="empty">
          <IconMapPin size={30} />
          <p className="et">This link doesn't have any locations</p>
          <p className="es">Ask your photographer to resend it.</p>
        </div>
      )}

      {spots.map((spot, i) => {
        const photo = spot.media[0]
        const tz = getRegion(spot.region).timeZone
        const w = bestLightWindow(spot, now)
        const when = w.start && w.end
          ? `${w.label} · ${fmtRange(w.start, w.end, tz)}`
          : w.start
            ? `${w.label} · from ${fmtTime(w.start, tz)}`
            : w.label
        return (
          <article className="clientcard" key={spot.id}>
            {photo && <img className="clientphoto" src={photo.src} alt={spot.name} loading="lazy" decoding="async" />}
            <div className="clientbody">
              <p className="optnum">Option {i + 1}</p>
              <h2>{spot.name}</h2>
              <p className="clientwhy">{spot.bestFor.join(' · ')}</p>
              <p className="clientlight"><IconSunset2 size={15} /> Best light: {when}</p>
              <a
                className="addresslink"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.address)}`}
                target="_blank" rel="noreferrer"
              >
                <IconMapPin size={13} /> {spot.address}
              </a>
            </div>
          </article>
        )
      })}

      <footer className="clientfoot">
        {spots.length > 0 && <p className="small tertiary">Light windows are for today at each location.</p>}
        <p className="small">Scouted with <a href="https://shootvantage.com">Vantage</a></p>
      </footer>
    </div>
  )
}
