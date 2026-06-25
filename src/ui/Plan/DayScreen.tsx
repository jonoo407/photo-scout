import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconCar, IconMoodEmpty } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { SPOTS } from '../../data/spots'
import { nextUp, type ShootingWindow } from '../../spots/next-up'
import { computeSunTimes } from '../../astro/sun-times'
import { haversineMiles } from '../../spots/distance'
import { driveMinutes } from '../../spots/live'
import { fmtTime } from '../../util/format'
import type { Spot } from '../../spots/types'

interface Stop { window: ShootingWindow; spot: Spot; reason: string; verdict: 'go' | 'maybe' | 'skip' }

export default function DayScreen() {
  const nav = useNavigate()
  const home = useStore((s) => s.home)
  const wishlistArr = useStore((s) => s.wishlist)

  const stops = useMemo<Stop[]>(() => {
    const wishlist = new Set(wishlistArr)
    const now = new Date()
    const sun = computeSunTimes(now, home.lat, home.lng)
    const starts = [sun.blueHourMorning.start, sun.goldenHourMorning.start, sun.goldenHourEvening.start, sun.blueHourEvening.start]
    const out: Stop[] = []
    for (const st of starts) {
      const r = nextUp({ now: new Date(st.getTime() - 60000), lat: home.lat, lng: home.lng, home, spots: SPOTS, wishlist })
      const top = r.ranked[0]
      if (top && (!out.length || out[out.length - 1].spot.id !== top.spot.id)) {
        out.push({ window: r.window, spot: top.spot, reason: top.reason, verdict: top.verdict })
      }
    }
    return out
  }, [home, wishlistArr])

  if (!stops.length) {
    return (
      <div className="screen">
        <button className="back" onClick={() => nav('/plan')}><IconArrowLeft size={18} /> Plan</button>
        <h1 style={{ fontSize: 21 }}>Your day</h1>
        <div className="empty">
          <IconMoodEmpty size={30} />
          <p className="et">No open spots for today's windows</p>
          <p className="es">Everything's closed for the upcoming light windows — check back tomorrow.</p>
        </div>
      </div>
    )
  }

  const leg = (i: number) =>
    i === 0 ? driveMinutes(stops[0].spot, home) : Math.round(haversineMiles(stops[i - 1].spot, stops[i].spot) * 2.2)
  const totalDrive = stops.reduce((sum, _, i) => sum + leg(i), 0)

  return (
    <div className="screen">
      <button className="back" onClick={() => nav('/plan')}><IconArrowLeft size={18} /> Plan</button>
      <h1 style={{ fontSize: 21 }}>Your day</h1>
      <p className="muted small" style={{ margin: '0 0 14px' }}>
        {stops.length} stops · ~{totalDrive} min driving · sunrise → sunset · light-optimized
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {stops.map((s, i) => (
          <div key={s.window.kind}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 56, flex: 'none', textAlign: 'right', fontSize: 12, color: 'var(--ink-2)', paddingTop: 12 }}>{fmtTime(s.window.start)}</div>
              <button className="spotcard" style={{ flex: 1 }} onClick={() => nav(`/spot/${s.spot.id}`)}>
                <div className="row-spread" style={{ gap: 8 }}>
                  <span className="nm">{s.spot.name}</span>
                  <span className={`pill ${s.verdict}`}>{s.verdict === 'go' ? 'Go' : s.verdict === 'maybe' ? 'Maybe' : 'Skip'}</span>
                </div>
                <p className="sub">{s.window.label} · {s.reason}</p>
              </button>
            </div>
            {i < stops.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-3)', fontSize: 11, margin: '2px 0 2px 18px', paddingLeft: 14, borderLeft: '1px dashed var(--line-strong)' }}>
                <IconCar size={13} /> drive {leg(i + 1)} min
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
