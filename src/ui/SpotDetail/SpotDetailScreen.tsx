import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconCoin, IconClock, IconCar, IconCompass,
  IconCamera, IconAperture, IconDeviceCctv, IconParking, IconBath, IconUsers,
  IconSquare, IconSquareCheck, IconStar, IconCircleCheck, IconNavigation,
  IconExternalLink, IconPhone, IconCalendarEvent, IconMapPin,
} from '@tabler/icons-react'
import SpotHero from './SpotHero'
import BestDays from './BestDays'
import { useStore } from '../../state/store'
import { useSpotById } from '../../state/useRegion'
import { CATEGORY_LABEL } from '../../spots/types'
import { computeSunTimes } from '../../astro/sun-times'
import {
  liveOpen, lightDirectionAt, DIRECTION_LABEL, driveMinutes, milesFromHome,
  directionsUrl, placeUrl,
} from '../../spots/live'
import { fmtTime, fmtRange, fmtDistance } from '../../util/format'
import { getRegion } from '../../data/regions'

const dirKind: Record<string, string> = { silhouette: 'go', front: 'go', side: 'info', back: 'maybe' }

export default function SpotDetailScreen() {
  const { id } = useParams()
  const nav = useNavigate()
  const { spot, loading } = useSpotById(id)
  const home = useStore((s) => s.home)
  const units = useStore((s) => s.units)
  const mapsApp = useStore((s) => s.mapsApp)
  const wishlist = useStore((s) => s.wishlist)
  const visited = useStore((s) => s.visited)
  const checklist = useStore((s) => s.checklist)
  const toggleWishlist = useStore((s) => s.toggleWishlist)
  const toggleVisited = useStore((s) => s.toggleVisited)
  const toggleShot = useStore((s) => s.toggleShot)
  const now = useMemo(() => new Date(), [])

  if (!spot) {
    return (
      <div className="screen">
        <button className="back" onClick={() => nav(-1)}><IconArrowLeft size={18} /> Back</button>
        <p className="center-note">{loading ? 'Loading…' : 'Spot not found.'}</p>
      </div>
    )
  }

  const tz = getRegion(spot.region).timeZone
  const sun = computeSunTimes(now, spot.lat, spot.lng)
  const open = liveOpen(spot, now, spot.lat, spot.lng)
  const drive = driveMinutes(spot, home)
  const miles = milesFromHome(spot, home)
  const wanted = wishlist.includes(spot.id)
  const been = visited.includes(spot.id)
  const doneShots = checklist[spot.id] ?? []
  const c = spot.craft

  const windows = [
    { label: 'Morning golden', a: sun.goldenHourMorning.start, b: sun.goldenHourMorning.end },
    { label: 'Evening golden', a: sun.goldenHourEvening.start, b: sun.goldenHourEvening.end },
    { label: 'Blue hour', a: sun.blueHourEvening.start, b: sun.blueHourEvening.end },
  ]

  const openLabel =
    open.state === 'open' ? `Open${open.closesAt ? ` till ${fmtTime(open.closesAt, tz)}` : ''}`
      : open.state === 'tour-only' ? 'Tour only'
        : open.state === 'call-ahead' ? 'Call ahead'
          : open.opensAt ? `Opens ${fmtTime(open.opensAt, tz)}` : 'Closed'
  const openGood = open.state === 'open'

  return (
    <div className="screen">
      <button className="back" onClick={() => nav(-1)}><IconArrowLeft size={18} /> Back</button>

      <SpotHero media={spot.media} />

      <div className="row-spread" style={{ marginTop: 14, alignItems: 'flex-start', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 21, margin: 0 }}>{spot.name}</h1>
          <p className="muted" style={{ fontSize: 13, margin: '3px 0 0' }}>{CATEGORY_LABEL[spot.category]} · {spot.city}</p>
          <a
            className="addresslink"
            href={`https://maps.${mapsApp === 'google' ? 'google.com/maps/search/?api=1&query=' : 'apple.com/?q='}${encodeURIComponent(spot.address)}`}
            target="_blank" rel="noreferrer"
          >
            <IconMapPin size={13} /> {spot.address}
          </a>
        </div>
      </div>

      <div className="facts">
        <span className="fact"><IconCoin size={15} /> {spot.isFree ? 'Free' : `$${spot.feeUSD}`}</span>
        <span className={`fact ${openGood ? 'good' : 'warn'}`}><IconClock size={15} /> {openLabel}</span>
        <span className="fact"><IconCar size={15} /> {drive} min · {fmtDistance(miles, units)}</span>
        {spot.facing != null && <span className="fact"><IconCompass size={15} /> {compass(spot.facing)}</span>}
      </div>

      <h3 className="h3">Today's light here</h3>
      <div className="card list">
        {windows.map((w) => {
          const dir = lightDirectionAt(spot, new Date((w.a.getTime() + w.b.getTime()) / 2), spot.lat, spot.lng)
          return (
            <div key={w.label} className="row">
              <span className="rowleft">{w.label} · {fmtRange(w.a, w.b, tz)}</span>
              {dir && <span className={`pill ${dirKind[dir]}`}>{DIRECTION_LABEL[dir]}</span>}
            </div>
          )
        })}
      </div>

      <BestDays spot={spot} />

      <h3 className="h3">How to shoot it</h3>
      <p className="muted" style={{ fontSize: 13, margin: '0 0 8px', lineHeight: 1.6 }}>{c.lightStrategy}</p>
      <ul className="howto">{c.compositionTips.map((t) => <li key={t}>{t}</li>)}</ul>
      <div className="facts">
        {c.gear.lens && <span className="fact"><IconCamera size={15} /> {c.gear.lens}</span>}
        {c.gear.tripod && <span className="fact"><IconDeviceCctv size={15} /> Tripod</span>}
        {c.gear.settingsHint && <span className="fact"><IconAperture size={15} /> {c.gear.settingsHint}</span>}
      </div>
      {c.ifCloudy && <p className="muted" style={{ fontSize: 13 }}><strong style={{ fontWeight: 500, color: 'var(--ink)' }}>If cloudy:</strong> {c.ifCloudy}</p>}

      <h3 className="h3">Signature shots</h3>
      <div className="card list">
        {c.signatureShots.map((shot) => {
          const checked = doneShots.includes(shot.id)
          return (
            <button key={shot.id} className={`check ${checked ? 'checked' : ''}`} onClick={() => toggleShot(spot.id, shot.id)}>
              {checked ? <IconSquareCheck size={20} className="box" /> : <IconSquare size={20} className="box" />}
              <span className="lbl">{shot.label}</span>
            </button>
          )
        })}
      </div>

      <h3 className="h3">Good to know</h3>
      <div className="goodtoknow">
        {spot.logistics?.parking && (
          <a className="parklink" href={placeUrl(spot.logistics.parking.lat ?? spot.lat, spot.logistics.parking.lng ?? spot.lng, spot.logistics.parking.label, mapsApp)} target="_blank" rel="noreferrer">
            <span><IconParking size={16} /> {spot.logistics.parking.label}</span>
            <span className="nowrap">Maps <IconExternalLink size={14} /></span>
          </a>
        )}
        {spot.logistics?.restrooms && <p><IconBath size={15} /> Restrooms on site</p>}
        {spot.logistics?.crowdTiming && <p><IconUsers size={15} /> {spot.logistics.crowdTiming}</p>}
        {spot.logistics?.dressCode && <p><IconUsers size={15} /> {spot.logistics.dressCode}</p>}
        {spot.feeNote && <p><IconCoin size={15} /> {spot.feeNote}</p>}
        {spot.phone && (
          <p><IconPhone size={15} /> <a className="tellink" href={`tel:${spot.phone.replace(/[^\d+]/g, '')}`}>{spot.phone}</a></p>
        )}
        {spot.caveats && <p style={{ color: 'var(--skip-ink)' }}>{spot.caveats}</p>}
        {c.accessTips && <p>{c.accessTips}</p>}
      </div>

      <button className="linkrow" style={{ margin: '14px 0', color: 'var(--terracotta)' }} onClick={() => nav(`/day?anchor=${spot.id}`)}>
        <span><IconCalendarEvent size={16} /> Plan a day around this spot</span>
      </button>

      <a className="cta" href={directionsUrl(spot, home, mapsApp)} target="_blank" rel="noreferrer">
        <IconNavigation size={18} /> Directions to spot
      </a>
      <div className="actions">
        <button className={`actbtn ${wanted ? 'on-want' : ''}`} onClick={() => toggleWishlist(spot.id)}>
          <IconStar size={16} /> {wanted ? 'On your list' : 'Want to go'}
        </button>
        <button className={`actbtn ${been ? 'on-been' : ''}`} onClick={() => toggleVisited(spot.id)}>
          <IconCircleCheck size={16} /> {been ? 'Visited' : 'Been there'}
        </button>
      </div>
    </div>
  )
}

function compass(bearing: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return `Faces ${dirs[Math.round(bearing / 45) % 8]}`
}
