import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconArrowBadgeRight, IconSunset2, IconMoon, IconCloud, IconChevronRight,
  IconBellRinging, IconCar, IconPointFilled, IconArrowRight, IconStack2, IconSettings,
} from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { SPOTS } from '../../data/spots'
import { nextUp, type RankedSpot } from '../../spots/next-up'
import { computeSunTimes } from '../../astro/sun-times'
import { moonInfo } from '../../astro/moon'
import { fetchWeather, weatherText, type WeatherNow } from '../../weather/open-meteo'
import { weatherVerdict } from '../../weather/verdict'
import { sunsetScore } from '../../weather/sunset-score'
import { fmtTime, untilString } from '../../util/format'
import { SpotCard } from '../SpotCard'

function openMeta(r: RankedSpot) {
  if (r.open.state === 'open') {
    return <span style={{ color: 'var(--go-ink)' }}><IconPointFilled size={12} /> Open</span>
  }
  if (r.open.state === 'tour-only') return <span style={{ color: 'var(--maybe-ink)' }}>Tour only</span>
  if (r.open.state === 'call-ahead') return <span style={{ color: 'var(--maybe-ink)' }}>Call ahead</span>
  if (r.open.opensAt) return <span style={{ color: 'var(--maybe-ink)' }}>Opens {fmtTime(r.open.opensAt)}</span>
  return <span style={{ color: 'var(--skip-ink)' }}>Closed</span>
}

export default function TodayScreen() {
  const nav = useNavigate()
  const home = useStore((s) => s.home)
  const wishlistArr = useStore((s) => s.wishlist)
  const wishlist = useMemo(() => new Set(wishlistArr), [wishlistArr])
  const units = useStore((s) => s.units)
  const now = useMemo(() => new Date(), [])

  const [weather, setWeather] = useState<WeatherNow | null>(null)
  const [weatherErr, setWeatherErr] = useState(false)
  useEffect(() => {
    let alive = true
    setWeatherErr(false)
    fetchWeather(home.lat, home.lng, now, units)
      .then((w) => { if (alive) setWeather(w) })
      .catch(() => { if (alive) setWeatherErr(true) })
    return () => { alive = false }
  }, [home.lat, home.lng, now, units])

  const verdict = weather ? weatherVerdict({ cloudCover: weather.cloudCover, precipProbability: weather.precipProb }) : undefined
  const result = useMemo(
    () => nextUp({ now, lat: home.lat, lng: home.lng, home, spots: SPOTS, wishlist, verdict }),
    [now, home, wishlist, verdict],
  )
  const moon = moonInfo(now, home.lat, home.lng)
  const sun = computeSunTimes(now, home.lat, home.lng)
  const sScore = weather ? sunsetScore(weather.sunsetLayers) : null

  const hr = now.getHours()
  const greeting = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const top = result.ranked.slice(0, 3)
  const eveningSunset = result.window.kind.startsWith('evening')

  return (
    <div className="screen">
      <div className="row-spread" style={{ alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">{dateStr}</p>
          <h1>{greeting}</h1>
        </div>
        <button aria-label="Settings" onClick={() => nav('/settings')} style={{ border: 0, background: 'none', cursor: 'pointer', color: 'var(--ink-2)', padding: 8, marginTop: 4 }}>
          <IconSettings size={22} />
        </button>
      </div>

      {sScore !== null && sScore >= 80 && eveningSunset && top[0] && (
        <button className="alert" style={{ border: 0, cursor: 'pointer', width: '100%' }} onClick={() => nav(`/spot/${top[0].spot.id}`)}>
          <IconBellRinging size={20} style={{ flex: 'none' }} />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p className="at">Tonight looks great — go</p>
            <p className="as">Sunset scoring {sScore} · best bet {top[0].spot.name}</p>
          </div>
          <IconChevronRight size={18} />
        </button>
      )}

      <div className="hero-card">
        <div className="row-spread">
          <span className="hero-label"><IconArrowBadgeRight size={15} /> NEXT UP</span>
          <button onClick={() => nav('/plan')} style={{ border: 0, background: 'none', cursor: 'pointer', font: 'inherit', fontSize: 12, color: 'var(--terracotta)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Plan my day <IconArrowRight size={14} />
          </button>
        </div>
        <div className="hero-title">
          <IconSunset2 size={20} color="var(--amber)" />
          <span className="t">{result.window.label}</span>
        </div>
        <p className="hero-sub">
          Starts {fmtTime(result.window.start)} · {untilString(result.window.start, now)} · sunset {fmtTime(sun.sunset)}
        </p>
      </div>
      <p className="small tertiary" style={{ margin: '0 2px 10px' }}>
        <IconStack2 size={13} /> Ranked by light fit · open now · drive time
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {top.map((r) => (
          <SpotCard
            key={r.spot.id}
            spot={r.spot}
            badge={{ label: r.verdict === 'go' ? 'Go' : r.verdict === 'maybe' ? 'Maybe' : 'Skip', kind: r.verdict }}
            reason={r.reason}
            meta={<><span><IconCar size={14} /> {r.driveMinutes} min</span>{openMeta(r)}</>}
          />
        ))}
      </div>

      <button className="linkrow" style={{ margin: '12px 0', color: 'var(--terracotta)' }} onClick={() => nav('/browse')}>
        <span>See all {result.ranked.length} spots for this window</span>
        <IconChevronRight size={16} />
      </button>

      <div className="stats">
        <div className="stat">
          <IconCloud size={18} />
          <p className="sv">{weather && weather.temp != null ? `${weather.temp}${weather.unit}` : '—'}</p>
          <p className="sl">{weather ? weatherText(weather.code) : weatherErr ? 'Weather unavailable' : 'Loading…'}</p>
        </div>
        <div className="stat">
          <IconSunset2 size={18} color="var(--amber)" />
          <p className="sv">{sScore ?? '—'}</p>
          <p className="sl">Sunset score</p>
        </div>
        <div className="stat">
          <IconMoon size={18} />
          <p className="sv">{moon.illumination}%</p>
          <p className="sl">{moon.phaseName}</p>
        </div>
      </div>

      <h3 className="h3">Today's light</h3>
      <div className="card list">
        <div className="row"><span className="rowleft">Sunrise</span><span className="muted">{fmtTime(sun.sunrise)}</span></div>
        <div className="row"><span className="rowleft">Morning golden</span><span className="muted">{fmtTime(sun.goldenHourMorning.start)} – {fmtTime(sun.goldenHourMorning.end)}</span></div>
        <div className="row"><span className="rowleft">Evening golden</span><span className="muted">{fmtTime(sun.goldenHourEvening.start)} – {fmtTime(sun.goldenHourEvening.end)}</span></div>
        <div className="row"><span className="rowleft">Sunset</span><span className="muted">{fmtTime(sun.sunset)}</span></div>
        <div className="row last"><span className="rowleft">Blue hour</span><span className="muted">{fmtTime(sun.blueHourEvening.start)} – {fmtTime(sun.blueHourEvening.end)}</span></div>
      </div>
    </div>
  )
}
