import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconArrowBadgeRight, IconSunset2, IconMoon, IconCloud, IconChevronRight,
  IconBellRinging, IconCar, IconPointFilled, IconArrowRight, IconStack2, IconSettings,
  IconMoon2, IconSunrise, IconSunHigh, IconSun, IconSunset, IconMoonStars, IconStars,
  IconChevronDown, IconChevronUp,
} from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { useAuth } from '../../auth/useAuth'
import { useRegion, useRegionSpots } from '../../state/useRegion'
import { nextUp, type RankedSpot } from '../../spots/next-up'
import { computeSunTimes } from '../../astro/sun-times'
import { moonInfo } from '../../astro/moon'
import { fetchWeather, weatherText, type WeatherNow } from '../../weather/open-meteo'
import { weatherVerdict } from '../../weather/verdict'
import { sunsetScore, sunsetLabel } from '../../weather/sunset-score'
import { fmtTime, fmtRange, fmtDrive, untilString } from '../../util/format'
import { SpotCard } from '../SpotCard'
import IntroCard from './IntroCard'

const GRADE_COLOR = { great: 'var(--go-ink)', decent: 'var(--maybe-ink)', meh: 'var(--ink-2)' } as const

function openMeta(r: RankedSpot, tz: string) {
  if (r.open.state === 'open') {
    return <span style={{ color: 'var(--go-ink)' }}><IconPointFilled size={12} /> Open</span>
  }
  if (r.open.state === 'tour-only') return <span style={{ color: 'var(--maybe-ink)' }}>Tour only</span>
  if (r.open.state === 'call-ahead') return <span style={{ color: 'var(--maybe-ink)' }}>Call ahead</span>
  if (r.open.opensAt) return <span style={{ color: 'var(--maybe-ink)' }}>Opens {fmtTime(r.open.opensAt, tz)}</span>
  return <span style={{ color: 'var(--skip-ink)' }}>Closed</span>
}

export default function TodayScreen() {
  const nav = useNavigate()
  const home = useStore((s) => s.home)
  const wishlistArr = useStore((s) => s.wishlist)
  const wishlist = useMemo(() => new Set(wishlistArr), [wishlistArr])
  const units = useStore((s) => s.units)
  const region = useRegion()
  const tz = region.timeZone
  const { spots } = useRegionSpots()
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
    () => nextUp({ now, lat: home.lat, lng: home.lng, home, spots, wishlist, verdict }),
    [now, home, spots, wishlist, verdict],
  )
  const setFilters = useStore((s) => s.setFilters)
  const sunTableCollapsed = useStore((s) => s.sunTableCollapsed)
  const toggleSunTable = useStore((s) => s.toggleSunTable)
  const linkError = useAuth((s) => s.linkError)
  const dismissLinkError = useAuth((s) => s.dismissLinkError)
  const moon = moonInfo(now, home.lat, home.lng)
  const sun = computeSunTimes(now, home.lat, home.lng)

  const sunRows: [React.ReactNode, string, string][] = [
    [<IconMoon2 size={18} color="var(--amber)" />, 'Morning blue hour', fmtRange(sun.blueHourMorning.start, sun.blueHourMorning.end, tz)],
    [<IconSunrise size={18} color="var(--amber)" />, 'Sunrise', fmtTime(sun.sunrise, tz)],
    [<IconSunHigh size={18} color="var(--amber)" />, 'Morning golden', fmtRange(sun.goldenHourMorning.start, sun.goldenHourMorning.end, tz)],
    [<IconSun size={18} color="var(--amber)" />, 'Solar noon', fmtTime(sun.solarNoon, tz)],
    [<IconSunset2 size={18} color="var(--amber)" />, 'Evening golden', fmtRange(sun.goldenHourEvening.start, sun.goldenHourEvening.end, tz)],
    [<IconSunset size={18} color="var(--amber)" />, 'Sunset', fmtTime(sun.sunset, tz)],
    [<IconMoonStars size={18} color="var(--amber)" />, 'Evening blue hour', fmtRange(sun.blueHourEvening.start, sun.blueHourEvening.end, tz)],
    [<IconStars size={18} color="var(--amber)" />, 'Night / astro', `${fmtTime(sun.astronomicalDusk, tz)} →`],
  ]
  const sScore = weather ? sunsetScore(weather.sunsetLayers) : null
  const sGrade = sScore != null ? sunsetLabel(sScore) : null

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

      <IntroCard />

      {/* A failed email sign-in link must be visible, not a silent guest
          state (incident 2026-07-16). Email links land on Today. */}
      {linkError && (
        <div className="alert" style={{ background: 'var(--skip-bg)', color: 'var(--skip-ink)' }}>
          <IconBellRinging size={20} style={{ flex: 'none' }} />
          <div style={{ flex: 1 }}>
            <p className="at">Sign-in link problem</p>
            <p className="as">{linkError}</p>
          </div>
          <button
            aria-label="Dismiss"
            onClick={dismissLinkError}
            style={{ border: 0, background: 'none', cursor: 'pointer', color: 'inherit', padding: 4 }}
          >
            ✕
          </button>
        </div>
      )}

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
          Starts {fmtTime(result.window.start, tz)} · {untilString(result.window.start, now)} · sunset {fmtTime(sun.sunset, tz)}
        </p>
      </div>
      {spots.length === 0 ? (
        <div className="empty">
          <IconStack2 size={28} />
          <p className="et">No spots in {region.label} yet</p>
          <p className="es">This city is set up but has no locations seeded — switch city in Settings, or check back soon.</p>
        </div>
      ) : (
        <>
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
                meta={<><span><IconCar size={14} /> {fmtDrive(r.driveMinutes)}</span>{openMeta(r, tz)}</>}
              />
            ))}
          </div>
        </>
      )}

      {spots.length > 0 && (
        <button
          className="linkrow"
          style={{ margin: '12px 0', color: 'var(--terracotta)' }}
          onClick={() => { setFilters({ lights: [result.window.light] }); nav('/explore') }}
        >
          <span>See all {result.ranked.length} spots for this window</span>
          <IconChevronRight size={16} />
        </button>
      )}

      <div className="stats">
        <div className="stat">
          <IconCloud size={18} />
          <p className="sv">{weather && weather.temp != null ? `${weather.temp}${weather.unit}` : '—'}</p>
          <p className="sl">{weather ? weatherText(weather.code) : weatherErr ? 'Weather unavailable' : 'Loading…'}</p>
        </div>
        <div className="stat">
          <IconSunset2 size={18} color="var(--amber)" />
          <p className="sv" style={sGrade ? { color: GRADE_COLOR[sGrade] } : undefined}>{sScore != null ? `${sScore}/100` : '—'}</p>
          <p className="sl">{sGrade ? `Sunset · ${sScore != null && sScore <= 10 ? 'sit it out' : sGrade}` : 'Sunset score'}</p>
        </div>
        <div className="stat">
          <IconMoon size={18} />
          <p className="sv">{moon.illumination}%</p>
          <p className="sl">{moon.phaseName}</p>
        </div>
      </div>

      {/* The full sun/moon reference table, moved here from Plan (IA 1d) —
          daily reference data on the daily screen, foldable out of the way. */}
      <button
        className="shdr row-spread"
        aria-expanded={!sunTableCollapsed}
        onClick={toggleSunTable}
        style={{ appearance: 'none', border: 0, background: 'none', width: '100%', cursor: 'pointer', font: 'inherit', display: 'flex' }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          SUN &amp; MOON TIMES <span className="pill info" style={{ letterSpacing: 0, whiteSpace: 'nowrap' }}>from Plan</span>
        </span>
        {sunTableCollapsed ? <IconChevronDown size={15} /> : <IconChevronUp size={15} />}
      </button>
      {!sunTableCollapsed && (
        <section aria-label="Sun and moon times" className="card list">
          {sunRows.map(([icon, label, time]) => (
            <div key={label} className="row">
              <span className="rowleft">{icon} {label}</span>
              <span className="muted nowrap">{time}</span>
            </div>
          ))}
          <div className="row last">
            <span className="rowleft"><IconMoon size={18} color="var(--amber)" /> <span>Moon {moon.illumination}% · {moon.phaseName}</span></span>
            <span className="muted nowrap">Rise {fmtTime(moon.rise, tz)} · Set {fmtTime(moon.set, tz)}</span>
          </div>
        </section>
      )}
    </div>
  )
}
