import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconMoon2, IconSunrise, IconSunHigh, IconSun, IconSunset2, IconSunset,
  IconMoonStars, IconStars, IconMoon, IconRoute, IconBuildingArch,
} from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { SPOTS } from '../../data/spots'
import { computeSunTimes } from '../../astro/sun-times'
import { moonInfo } from '../../astro/moon'
import { fmtTime, fmtRange } from '../../util/format'
import type { Light } from '../../spots/types'

const names = (pred: (l: Light[]) => boolean) =>
  SPOTS.filter((s) => pred(s.bestLight)).map((s) => s.name).join(' · ')

export default function PlanScreen() {
  const nav = useNavigate()
  const home = useStore((s) => s.home)
  const [day, setDay] = useState<0 | 1>(0)
  const date = useMemo(() => new Date(Date.now() + day * 86400000), [day])
  const t = computeSunTimes(date, home.lat, home.lng)
  const moon = moonInfo(date, home.lat, home.lng)

  const rows: [React.ReactNode, string, string][] = [
    [<IconMoon2 size={18} color="var(--amber)" />, 'Morning blue hour', fmtRange(t.blueHourMorning.start, t.blueHourMorning.end)],
    [<IconSunrise size={18} color="var(--amber)" />, 'Sunrise', fmtTime(t.sunrise)],
    [<IconSunHigh size={18} color="var(--amber)" />, 'Morning golden', fmtRange(t.goldenHourMorning.start, t.goldenHourMorning.end)],
    [<IconSun size={18} color="var(--amber)" />, 'Solar noon', fmtTime(t.solarNoon)],
    [<IconSunset2 size={18} color="var(--amber)" />, 'Evening golden', fmtRange(t.goldenHourEvening.start, t.goldenHourEvening.end)],
    [<IconSunset size={18} color="var(--amber)" />, 'Sunset', fmtTime(t.sunset)],
    [<IconMoonStars size={18} color="var(--amber)" />, 'Evening blue hour', fmtRange(t.blueHourEvening.start, t.blueHourEvening.end)],
    [<IconStars size={18} color="var(--amber)" />, 'Night / astro', `${fmtTime(t.astronomicalDusk)} →`],
  ]

  return (
    <div className="screen">
      <h1>Plan</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className={`chip ${day === 0 ? 'on' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDay(0)}>Today</button>
        <button className={`chip ${day === 1 ? 'on' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDay(1)}>Tomorrow</button>
      </div>

      <button className="cta" style={{ marginBottom: 14 }} onClick={() => nav('/day')}>
        <IconRoute size={18} /> Build my whole day
      </button>

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
        <span className="muted">Rise {fmtTime(moon.rise)} · Set {fmtTime(moon.set)}</span>
      </div>

      <h3 className="h3">Spots by light</h3>
      <p className="bucket"><IconSunset2 size={15} color="var(--amber)" /> Sunset / evening</p>
      <div className="bcard">{names((l) => l.includes('sunset') || l.includes('evening-golden'))}</div>
      <p className="bucket"><IconSunrise size={15} color="var(--amber)" /> Sunrise / morning</p>
      <div className="bcard">{names((l) => l.includes('sunrise') || l.includes('morning-golden'))}</div>
      <p className="bucket"><IconBuildingArch size={15} /> Daytime / interiors</p>
      <div className="bcard">{names((l) => l.includes('daytime') || l.includes('open-shade'))}</div>
    </div>
  )
}
