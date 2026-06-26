import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconArrowLeft, IconCar, IconMoodEmpty, IconArrowsShuffle, IconStar, IconCheck, IconX } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { SPOTS } from '../../data/spots'
import { planDay, type PlanStop } from '../../spots/day-plan'
import { haversineMiles } from '../../spots/distance'
import { driveMinutes } from '../../spots/live'
import { CATEGORY_LABEL } from '../../spots/types'
import { fmtTime } from '../../util/format'
import type { Spot } from '../../spots/types'

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
  const [picked, setPicked] = useState<Record<string, string>>({}) // blockKey -> spot id
  const [sheet, setSheet] = useState<string | null>(null) // open chooser for this block

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

  // Resolve the displayed spot per block (a swap overrides the planned pick).
  const optionsFor = (stop: PlanStop): Spot[] => [stop.spot, ...stop.alternatives]
  const display = plan.map((stop) => {
    const opts = optionsFor(stop)
    const chosenId = picked[stop.block.key]
    const spot = (chosenId && opts.find((s) => s.id === chosenId)) || stop.spot
    return { ...stop, spot, swappable: stop.alternatives.length > 0 && !stop.anchored }
  })
  const leg = (i: number) =>
    i === 0 ? driveMinutes(display[0].spot, home) : Math.round(haversineMiles(display[i - 1].spot, display[i].spot) * 2.2)
  const total = display.reduce((sum, _, i) => sum + leg(i), 0)

  // Chooser: ranked candidates for the open block, minus spots used elsewhere.
  const sheetIdx = sheet ? display.findIndex((d) => d.block.key === sheet) : -1
  const sheetStop = sheetIdx >= 0 ? plan[sheetIdx] : null
  const usedElsewhere = new Set(display.filter((d) => d.block.key !== sheet).map((d) => d.spot.id))
  const sheetFrom = sheetIdx > 0 ? display[sheetIdx - 1].spot : home
  const sheetOptions = sheetStop
    ? optionsFor(sheetStop).filter((s) => s.id === display[sheetIdx].spot.id || !usedElsewhere.has(s.id))
    : []

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
                    {s.anchored
                      ? <><IconStar size={12} style={{ verticalAlign: '-1px' }} /> Your anchor for the day · {fmtTime(s.block.time)}</>
                      : <>{s.reason} · {fmtTime(s.block.time)}</>}
                  </p>
                </button>
                {s.swappable && (
                  <button
                    className="actbtn"
                    style={{ flex: 'none', width: 46, padding: 0 }}
                    aria-label={`Swap ${s.block.label} spot`}
                    onClick={() => setSheet(s.block.key)}
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
        Tap <IconArrowsShuffle size={12} /> to choose a different spot for a stop, or tap a spot for details and directions.
      </p>

      {sheetStop && (
        <div className="sheet-backdrop" onClick={() => setSheet(null)}>
          <div className="sheet" role="dialog" aria-label={`Choose a ${sheetStop.block.label} spot`} onClick={(e) => e.stopPropagation()}>
            <div className="row-spread" style={{ marginBottom: 8 }}>
              <h4>{sheetStop.block.label}</h4>
              <button className="back" style={{ margin: 0 }} aria-label="Close" onClick={() => setSheet(null)}><IconX size={18} /></button>
            </div>
            <p className="small tertiary" style={{ margin: '0 0 6px' }}>Best fit first — by light, distance and your list.</p>
            {sheetOptions.map((opt) => {
              const isCurrent = opt.id === display[sheetIdx].spot.id
              const dmin = Math.round(haversineMiles(sheetFrom, opt) * 2.2)
              const wished = wishlistArr.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  className="opt"
                  onClick={() => { setPicked((p) => ({ ...p, [sheetStop.block.key]: opt.id })); setSheet(null) }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span className="nm" style={{ fontSize: 14 }}>{wished && <IconStar size={12} style={{ verticalAlign: '-1px', color: 'var(--maybe-ink)' }} />} {opt.name}</span>
                    <span className="sub" style={{ display: 'block' }}>{CATEGORY_LABEL[opt.category]} · ~{dmin} min</span>
                  </span>
                  {isCurrent && <IconCheck size={18} className="on-check" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
