import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconMoon2, IconSunrise, IconSunHigh, IconSun, IconSunset2, IconSunset,
  IconMoonStars, IconStars, IconMoon, IconRoute, IconBuildingArch, IconMap2,
} from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { useRegion, useRegionSpots } from '../../state/useRegion'
import { computeSunTimes } from '../../astro/sun-times'
import { moonInfo } from '../../astro/moon'
import { planPath } from '../../spots/plan-link'
import { fmtTime, fmtRange } from '../../util/format'
import type { Light } from '../../spots/types'

function SpotLinks({ pred }: { pred: (l: Light[]) => boolean }) {
  const nav = useNavigate()
  const list = useRegionSpots().spots.filter((s) => pred(s.bestLight))
  if (!list.length) return <div className="bcard tertiary">None today</div>
  return (
    <div className="bcard spotlinks">
      {list.map((s) => (
        <button key={s.id} className="spotlink" onClick={() => nav(`/spot/${s.id}`)}>{s.name}</button>
      ))}
    </div>
  )
}

export default function PlanScreen() {
  const nav = useNavigate()
  const home = useStore((s) => s.home)
  const savedPlans = useStore((s) => s.savedPlans)
  const deletePlan = useStore((s) => s.deletePlan)
  const [armedDelete, setArmedDelete] = useState<string | null>(null)
  const tz = useRegion().timeZone
  const [day, setDay] = useState<0 | 1>(0)
  const date = useMemo(() => new Date(Date.now() + day * 86400000), [day])
  const t = computeSunTimes(date, home.lat, home.lng)
  const moon = moonInfo(date, home.lat, home.lng)

  const rows: [React.ReactNode, string, string][] = [
    [<IconMoon2 size={18} color="var(--amber)" />, 'Morning blue hour', fmtRange(t.blueHourMorning.start, t.blueHourMorning.end, tz)],
    [<IconSunrise size={18} color="var(--amber)" />, 'Sunrise', fmtTime(t.sunrise, tz)],
    [<IconSunHigh size={18} color="var(--amber)" />, 'Morning golden', fmtRange(t.goldenHourMorning.start, t.goldenHourMorning.end, tz)],
    [<IconSun size={18} color="var(--amber)" />, 'Solar noon', fmtTime(t.solarNoon, tz)],
    [<IconSunset2 size={18} color="var(--amber)" />, 'Evening golden', fmtRange(t.goldenHourEvening.start, t.goldenHourEvening.end, tz)],
    [<IconSunset size={18} color="var(--amber)" />, 'Sunset', fmtTime(t.sunset, tz)],
    [<IconMoonStars size={18} color="var(--amber)" />, 'Evening blue hour', fmtRange(t.blueHourEvening.start, t.blueHourEvening.end, tz)],
    [<IconStars size={18} color="var(--amber)" />, 'Night / astro', `${fmtTime(t.astronomicalDusk, tz)} →`],
  ]

  return (
    <div className="screen">
      <h1>Plan</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className={`chip ${day === 0 ? 'on' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDay(0)}>Today</button>
        <button className={`chip ${day === 1 ? 'on' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDay(1)}>Tomorrow</button>
      </div>

      <button className="cta" style={{ marginBottom: 14 }} onClick={() => nav(`/day?day=${day}`)}>
        <IconRoute size={18} /> Build {day === 1 ? "tomorrow's" : "today's"} itinerary
      </button>

      {savedPlans.length > 0 && (
        <>
          <h3 className="h3">Saved plans</h3>
          <div className="card list" style={{ marginBottom: 16 }}>
            {savedPlans.map((p) => (
              <div key={p.id} className="row" style={{ gap: 8 }}>
                <button
                  className="rowleft"
                  style={{ appearance: 'none', border: 0, background: 'none', cursor: 'pointer', color: 'var(--ink)', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: 0, minWidth: 0, textAlign: 'left' }}
                  onClick={() => nav(planPath(p.date, p.stops))}
                >
                  <span style={{ fontWeight: 500, fontSize: 14 }}><IconMap2 size={14} style={{ verticalAlign: '-2px' }} /> {p.name}</span>
                  <span className="small tertiary">{p.stops.length} {p.stops.length === 1 ? 'stop' : 'stops'}</span>
                </button>
                <button
                  className="chip act"
                  style={{ flex: 'none' }}
                  onClick={() => {
                    if (armedDelete === p.id) { deletePlan(p.id); setArmedDelete(null) }
                    else setArmedDelete(p.id)
                  }}
                >
                  {armedDelete === p.id ? 'Confirm delete' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="h3">Light &amp; sun times</h3>
      <div className="card list" style={{ marginBottom: 10 }}>
        {rows.map(([icon, label, time]) => (
          <div key={label} className="row">
            <span className="rowleft">{icon} {label}</span>
            <span className="muted">{time}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: '11px 12px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 13 }}>
        <span><IconMoon size={15} /> Moon {moon.illumination}% · {moon.phaseName}</span>
        <span className="muted">Rise {fmtTime(moon.rise, tz)} · Set {fmtTime(moon.set, tz)}</span>
      </div>

      <h3 className="h3">Spots by light</h3>
      <p className="bucket"><IconSunset2 size={15} color="var(--amber)" /> Sunset / evening</p>
      <SpotLinks pred={(l) => l.includes('sunset') || l.includes('evening-golden')} />
      <p className="bucket"><IconSunrise size={15} color="var(--amber)" /> Sunrise / morning</p>
      <SpotLinks pred={(l) => l.includes('sunrise') || l.includes('morning-golden')} />
      <p className="bucket"><IconBuildingArch size={15} /> Daytime / interiors</p>
      <SpotLinks pred={(l) => l.includes('daytime') || l.includes('open-shade')} />
    </div>
  )
}
