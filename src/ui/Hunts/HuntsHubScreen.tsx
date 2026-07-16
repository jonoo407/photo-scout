import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconChevronLeft, IconChevronRight, IconCircleCheck, IconCamera } from '@tabler/icons-react'
import { useAuth } from '../../auth/useAuth'
import { authAvailable } from '../../auth/supabase'
import { useRegion } from '../../state/useRegion'
import { fetchHunts, fetchMyHuntState, joinHunt, type MyHuntState } from '../../hunts/hunts-api'
import { huntStatus, isOpen, maxPoints, type Hunt } from '../../hunts/hunts'
import { fmtDay } from '../../util/format'

/* The Photo Hunts hub (handoff 2c): your active hunts up top, open hunts to
   join, finished ones for the trophy shelf. Hunt content is DB-driven per
   city; completion truth is server-side. */
export default function HuntsHubScreen() {
  const nav = useNavigate()
  const user = useAuth((s) => s.user)
  const region = useRegion()
  const [hunts, setHunts] = useState<Hunt[] | null>(null)
  const [mine, setMine] = useState<MyHuntState>({ joins: [], progress: [] })
  const [nudge, setNudge] = useState(false)
  const now = useMemo(() => new Date(), [])

  useEffect(() => {
    let alive = true
    void fetchHunts(region.id).then((h) => { if (alive) setHunts(h) })
    return () => { alive = false }
  }, [region.id])
  useEffect(() => {
    if (!user) { setMine({ joins: [], progress: [] }); return }
    let alive = true
    void fetchMyHuntState().then((s) => { if (alive) setMine(s) })
    return () => { alive = false }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = (hunts ?? []).map((h) => ({
    hunt: h,
    status: huntStatus(h, mine.progress.filter((p) => p.huntId === h.id)),
    joined: mine.joins.includes(h.id),
    open: isOpen(h, now),
    lastAt: mine.progress.filter((p) => p.huntId === h.id).map((p) => p.createdAt).sort().at(-1),
  }))
  const active = rows.filter((r) => r.joined && !r.status.finished && r.open)
  const joinable = rows.filter((r) => !r.joined && !r.status.finished && r.open)
  const completed = rows.filter((r) => r.status.finished)

  const join = async (hunt: Hunt) => {
    if (!user) { setNudge(true); return }
    const ok = await joinHunt(hunt.id)
    if (ok) nav(`/hunts/${hunt.id}`)
  }

  return (
    <div className="screen">
      <button className="back" onClick={() => nav('/you')}><IconChevronLeft size={16} /> You</button>
      <p className="eyebrow" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 12 }}>{region.label}</p>
      <h1>Photo hunts</h1>
      <p className="small muted" style={{ margin: '4px 2px 14px', lineHeight: 1.5 }}>
        Shoot every stop to finish a hunt — +{(hunts?.[0]?.stopPts ?? 25)} per stop, +{(hunts?.[0]?.finishPts ?? 100)} when you finish. Shots are verified at the spot.
      </p>

      {nudge && authAvailable() && (
        <div className="card" style={{ padding: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="small" style={{ flex: 1 }}>Accounts are free — sign in to join hunts and keep your points.</span>
          <button className="chip act" style={{ flex: 'none' }} onClick={() => nav('/settings')}>Sign in</button>
        </div>
      )}

      {hunts !== null && hunts.length === 0 && (
        <div className="empty">
          <IconCamera size={30} />
          <p className="et">No hunts in {region.label} yet</p>
          <p className="es">New hunts land city by city — check back soon.</p>
        </div>
      )}

      {active.length > 0 && (
        <>
          <p className="shdr">ACTIVE</p>
          {active.map(({ hunt, status }) => (
            <div key={hunt.id} className="card" style={{ border: '0.5px solid var(--amber)', padding: 14, marginBottom: 10 }}>
              <div className="row-spread">
                <p style={{ margin: 0, fontWeight: 500, fontSize: 15 }}>{hunt.title}</p>
                <span className="pill maybe" style={{ whiteSpace: 'nowrap' }}>{status.done} of {status.total} stops</span>
              </div>
              <span className="progressbar" style={{ display: 'block', margin: '10px 0' }}>
                <span className="progressfill" style={{ width: `${Math.round((status.done / status.total) * 100)}%`, background: 'var(--amber)' }} />
              </span>
              <button className="cta" onClick={() => nav(`/hunts/${hunt.id}`)}>Continue</button>
            </div>
          ))}
        </>
      )}

      {joinable.length > 0 && (
        <>
          <p className="shdr">OPEN HUNTS</p>
          <div className="card list" style={{ marginBottom: 4 }}>
            {joinable.map(({ hunt }) => (
              <div key={hunt.id} className="row" style={{ gap: 8 }}>
                <button
                  className="rowleft"
                  style={{ appearance: 'none', border: 0, background: 'none', cursor: 'pointer', color: 'var(--ink)', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: 0, minWidth: 0, textAlign: 'left' }}
                  onClick={() => nav(`/hunts/${hunt.id}`)}
                >
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{hunt.title}</span>
                  <span className="small tertiary">
                    {hunt.stops.length} stops · up to {maxPoints(hunt)} pts{hunt.closesAt ? ` · ends ${fmtDay(new Date(hunt.closesAt))}` : ''}
                  </span>
                </button>
                <button className="chip act" style={{ flex: 'none' }} onClick={() => void join(hunt)}>Join</button>
              </div>
            ))}
          </div>
        </>
      )}

      {completed.length > 0 && (
        <>
          <p className="shdr">COMPLETED</p>
          <div className="card list">
            {completed.map(({ hunt, lastAt }) => (
              <button key={hunt.id} className="row" onClick={() => nav(`/hunts/${hunt.id}`)}>
                <span className="rowleft"><IconCircleCheck size={16} color="var(--go-ink)" /> {hunt.title}</span>
                <span className="val small">{lastAt ? fmtDay(new Date(lastAt)) : ''} <IconChevronRight size={14} color="var(--ink-3)" /></span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
