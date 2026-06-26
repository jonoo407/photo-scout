import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconArrowLeft, IconCar, IconMoodEmpty, IconArrowsShuffle, IconStar } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { SPOTS } from '../../data/spots'
import { planDay } from '../../spots/day-plan'
import { haversineMiles } from '../../spots/distance'
import { driveMinutes } from '../../spots/live'
import { fmtTime } from '../../util/format'

function badge(state: string): { label: string; kind: string } {
  if (state === 'open') return { label: 'Open', kind: 'open' }
  if (state === 'tour-only') return { label: 'Tour only', kind: 'info' }
  if (state === 'call-ahead') return { label: 'Call ahead', kind: 'info' }
  return { label: 'Closed', kind: 'closed' }
}

export default function DayScreen() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const dayOffset = params.get('day') === '1' ? 1 : 0
  const anchorId = params.get('anchor') ?? undefined
  const home = useStore((s) => s.home)
  const wishlistArr = useStore((s) => s.wishlist)
  const [swap, setSwap] = useState<Record<string, number>>({})

  const plan = useMemo(() => {
    const date = new Date(Date.now() + dayOffset * 86400000)
    return planDay({ date, home, spots: SPOTS, wishlist: new Set(wishlistArr), anchorId })
  }, [home, wishlistArr, dayOffset, anchorId])

  const Header = (
    <>
      <button className="back" onClick={() => nav('/plan')}><IconArrowLeft size={18} /> Plan</button>
      <h1 style={{ fontSize: 21 }}>Your day</h1>
    </>
  )

  if (!plan.length) {
    return (
      <div className="screen">
        {Header}
        <div className="empty">
          <IconMoodEmpty size={30} />
          <p className="et">No open spots for {dayOffset ? "tomorrow's" : "today's"} windows</p>
          <p className="es">Try the other day, or widen your wishlist.</p>
        </div>
      </div>
    )
  }

  // Resolve the displayed spot per block (swap cycles through alternatives).
  const display = plan.map((stop) => {
    const options = [stop.spot, ...stop.alternatives]
    const idx = (swap[stop.block.key] ?? 0) % options.length
    return { ...stop, spot: options[idx], canSwap: options.length > 1 && !stop.anchored }
  })
  const leg = (i: number) =>
    i === 0 ? driveMinutes(display[0].spot, home) : Math.round(haversineMiles(display[i - 1].spot, display[i].spot) * 2.2)
  const total = display.reduce((sum, _, i) => sum + leg(i), 0)

  return (
    <div className="screen">
      {Header}
      <p className="muted small" style={{ margin: '0 0 14px' }}>
        {display.length} stops · ~{total} min driving · {dayOffset ? 'tomorrow' : 'today'}
        {anchorId ? ' · around your pick' : ''}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {display.map((s, i) => {
          const b = badge(s.open.state)
          return (
            <div key={s.block.key}>
              <p className="bucket" style={{ margin: '6px 0 2px' }}>{s.block.label} · {fmtTime(s.block.start)}</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                <button className="spotcard" style={{ flex: 1 }} onClick={() => nav(`/spot/${s.spot.id}`)}>
                  <div className="row-spread" style={{ gap: 8 }}>
                    <span className="nm">{s.spot.name}</span>
                    <span className={`pill ${b.kind}`}>{b.label}</span>
                  </div>
                  <p className="sub">
                    {s.anchored && <><IconStar size={12} style={{ verticalAlign: '-1px' }} /> Your anchor for the day · </>}
                    {!s.anchored && s.reason}
                    {!s.anchored && ` · ${fmtTime(s.block.time)}`}
                  </p>
                </button>
                {s.canSwap && (
                  <button
                    className="actbtn"
                    style={{ flex: 'none', width: 46, padding: 0 }}
                    aria-label={`Swap ${s.block.label} spot`}
                    onClick={() => setSwap((p) => ({ ...p, [s.block.key]: (p[s.block.key] ?? 0) + 1 }))}
                  >
                    <IconArrowsShuffle size={18} />
                  </button>
                )}
              </div>
              {i < display.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-3)', fontSize: 11, margin: '2px 0 2px 18px', paddingLeft: 14, borderLeft: '1px dashed var(--line-strong)' }}>
                  <IconCar size={13} /> drive {leg(i + 1)} min
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="small tertiary" style={{ marginTop: 14, lineHeight: 1.6 }}>
        Tap <IconArrowsShuffle size={12} /> to swap a stop, or tap a spot for details and directions.
      </p>
    </div>
  )
}
