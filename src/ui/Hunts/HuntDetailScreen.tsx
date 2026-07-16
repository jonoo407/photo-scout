import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IconChevronLeft, IconCheck, IconLock, IconCamera, IconCameraPlus, IconChevronRight } from '@tabler/icons-react'
import { useAuth } from '../../auth/useAuth'
import { authAvailable } from '../../auth/supabase'
import {
  fetchHuntById, fetchMyHuntState, joinHunt, submitHuntStop,
} from '../../hunts/hunts-api'
import { huntStatus, stopState, isOpen, type Hunt, type HuntProgressRow } from '../../hunts/hunts'
import { uploadSpotPhoto, spotPhotoUrl } from '../../spots/photos-api'
import { getPosition } from '../../hunts/geo'
import { fmtDay } from '../../util/format'
import HuntCompleteSheet from './HuntCompleteSheet'

/* Hunt detail (handoff 2d): done stops with their proof shots, the next stop
   with a Submit-a-shot flow (upload → locate → server-validated RPC), and
   later stops locked until it's their turn. */
export default function HuntDetailScreen() {
  const nav = useNavigate()
  const { id } = useParams()
  const user = useAuth((s) => s.user)
  const [hunt, setHunt] = useState<Hunt | null | 'loading'>('loading')
  const [rows, setRows] = useState<HuntProgressRow[]>([])
  const [joined, setJoined] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finishedTotal, setFinishedTotal] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const now = useMemo(() => new Date(), [])

  useEffect(() => {
    if (!id) return
    let alive = true
    void fetchHuntById(id).then((h) => { if (alive) setHunt(h) })
    return () => { alive = false }
  }, [id])
  useEffect(() => {
    if (!user || !id) { setRows([]); setJoined(false); return }
    let alive = true
    void fetchMyHuntState().then((s) => {
      if (!alive) return
      setRows(s.progress.filter((p) => p.huntId === id))
      setJoined(s.joins.includes(id))
    })
    return () => { alive = false }
  }, [user?.id, id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Proof thumbnails for done stops.
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  useEffect(() => {
    let alive = true
    void Promise.all(rows.map(async (r) => [r.photoPath, await spotPhotoUrl(r.photoPath)] as const))
      .then((pairs) => { if (alive) setThumbs(Object.fromEntries(pairs)) })
      .catch(() => {})
    return () => { alive = false }
  }, [rows])

  if (hunt === 'loading') return <div className="screen"><p className="center-note">Loading…</p></div>
  if (!hunt) {
    return (
      <div className="screen">
        <button className="back" onClick={() => nav('/hunts')}><IconChevronLeft size={16} /> Hunts</button>
        <div className="empty"><IconCamera size={30} /><p className="et">Hunt not found</p></div>
      </div>
    )
  }

  const status = huntStatus(hunt, rows)
  const open = isOpen(hunt, now)
  const rowFor = (i: number) => rows.find((r) => r.stopIndex === i)

  const onFile = async (file: File | undefined) => {
    if (!file || status.nextIndex == null) return
    setBusy(true)
    setError(null)
    const stopIndex = status.nextIndex
    const stop = hunt.stops[stopIndex]
    try {
      const pos = await getPosition()
      const path = await uploadSpotPhoto(stop.spotId, file)
      const res = await submitHuntStop({ huntId: hunt.id, stopIndex, photoPath: path, lat: pos.lat, lng: pos.lng })
      if (!res.ok) { setError(res.message); return }
      setRows((r) => [...r, { huntId: hunt.id, stopIndex, photoPath: path, createdAt: new Date().toISOString() }])
      if (res.finished) setFinishedTotal(res.totalPts)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong — try again.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="screen">
      <button className="back" onClick={() => nav('/hunts')}><IconChevronLeft size={16} /> Hunts</button>
      <p className="eyebrow" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 12 }}>Photo hunt</p>
      <h1>{hunt.title}</h1>
      <div className="facts" style={{ margin: '10px 0' }}>
        <span className="fact">+{hunt.stopPts} per stop</span>
        <span className="fact good">+{hunt.finishPts} finish bonus</span>
        {hunt.closesAt && <span className="fact warn">Ends {fmtDay(new Date(hunt.closesAt))}</span>}
      </div>
      {hunt.blurb && <p className="small muted" style={{ margin: '0 2px 10px', lineHeight: 1.5 }}>{hunt.blurb}</p>}

      <span className="progressbar" style={{ display: 'block', margin: '4px 0 6px' }}>
        <span className="progressfill" style={{ width: `${Math.round((status.done / status.total) * 100)}%`, background: 'var(--amber)' }} />
      </span>
      <p className="small tertiary" style={{ margin: '0 2px 14px' }}>{status.done} of {status.total} stops shot</p>

      {!user && authAvailable() && (
        <div className="empty">
          <IconCamera size={30} />
          <p className="et">Sign in to hunt</p>
          <p className="es">Accounts are free — your stops, shots, and points need a home. Sign in from Settings → Account.</p>
          <button className="chip act" onClick={() => nav('/settings')}>Open Settings</button>
        </div>
      )}

      {user && !joined && open && !status.finished && (
        <button className="cta" style={{ marginBottom: 14 }} onClick={() => { void joinHunt(hunt.id).then((ok) => ok && setJoined(true)) }}>
          Join this hunt
        </button>
      )}

      {/* Before joining (or signed out), the whole route is browsable — every
          location tappable to its spot guide (feedback 2026-07-16). Locks
          only gate SUBMITTING, never looking. */}
      {(!user || !joined) && !status.finished ? (
        <div className="card list">
          {hunt.stops.map((stop, i) => (
            <button key={i} className="row" onClick={() => nav(`/spot/${stop.spotId}`)}>
              <span className="rowleft">
                <span className="thumbicon" style={{ width: 40, height: 40 }}><IconCamera size={16} /></span>
                <span>
                  {i + 1} · {stop.name}
                  {stop.hint && <span className="small tertiary" style={{ display: 'block' }}>{stop.hint}</span>}
                </span>
              </span>
              <span className="val"><IconChevronRight size={14} color="var(--ink-3)" /></span>
            </button>
          ))}
        </div>
      ) : (
      <div className="card list">
        {hunt.stops.map((stop, i) => {
          const state = stopState(i, status.done)
          if (state === 'done') {
            const r = rowFor(i)
            return (
              <div key={i} className="row">
                <span className="rowleft">
                  <span className="thumbicon" style={{ width: 40, height: 40 }}>
                    {r && thumbs[r.photoPath]
                      ? <img src={thumbs[r.photoPath]} alt={`Your shot at ${stop.name}`} />
                      : <IconCamera size={16} />}
                  </span>
                  <span>
                    {i + 1} · {stop.name}
                    <span className="small tertiary" style={{ display: 'block' }}>{r ? `Shot ${fmtDay(new Date(r.createdAt))}` : 'Done'}</span>
                  </span>
                </span>
                <span className="val small nowrap" style={{ color: 'var(--go-ink)' }}>+{hunt.stopPts} <IconCheck size={14} /></span>
              </div>
            )
          }
          if (state === 'next' && user && joined && open) {
            return (
              <div key={i} className="row" style={{ display: 'block', background: 'var(--maybe-bg)' }}>
                <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>
                  {i + 1} · {stop.name} <span className="pill info" style={{ marginLeft: 4 }}>next</span>
                </p>
                {stop.hint && <p className="small" style={{ margin: '5px 0 0', color: 'var(--maybe-ink)', lineHeight: 1.5 }}>{stop.hint}</p>}
                <p className="small tertiary" style={{ margin: '5px 0 10px', lineHeight: 1.5 }}>
                  Submit from your camera roll or the in-app camera — the shot must be taken within 150 m of the stop.
                </p>
                <label className="cta" style={{ cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }} role="button" aria-disabled={busy}>
                  <IconCameraPlus size={17} /> {busy ? 'Verifying…' : 'Submit a shot'}
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    disabled={busy}
                    style={{ display: 'none' }}
                    onChange={(e) => void onFile(e.target.files?.[0])}
                  />
                </label>
                {error && <p className="small" style={{ color: 'var(--skip-ink)', margin: '8px 0 0' }}>{error}</p>}
                <button
                  className="parklink"
                  style={{ marginTop: 10 }}
                  onClick={() => nav(`/spot/${stop.spotId}`)}
                >
                  <span>View the spot guide</span>
                  <IconChevronRight size={14} />
                </button>
              </div>
            )
          }
          return (
            <button key={i} className="row" style={state === 'locked' ? { opacity: 0.55 } : undefined} onClick={() => nav(`/spot/${stop.spotId}`)}>
              <span className="rowleft">
                <span className="thumbicon" style={{ width: 40, height: 40 }}><IconLock size={16} /></span>
                <span>
                  {i + 1} · {stop.name}
                  <span className="small tertiary" style={{ display: 'block' }}>
                    {state === 'locked' ? `Unlocks after stop ${i}` : 'Join to start'}
                  </span>
                </span>
              </span>
            </button>
          )
        })}
      </div>
      )}

      {!open && <p className="center-note" style={{ marginTop: 10 }}>This hunt isn't open right now.</p>}

      {finishedTotal != null && (
        <HuntCompleteSheet hunt={hunt} totalPts={finishedTotal} onClose={() => { setFinishedTotal(null); nav('/hunts') }} />
      )}
    </div>
  )
}
