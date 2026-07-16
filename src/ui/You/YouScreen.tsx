import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconChevronRight, IconUser } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { useAuth } from '../../auth/useAuth'
import { authAvailable } from '../../auth/supabase'
import { pointsTotal, type PointEvent } from '../../craft/points'
import { fetchMyPointEvents } from '../../craft/points-api'
import { tierProgress } from '../../craft/tiers'
import { savedProgress } from '../../spots/progress'
import { listAllMyPhotos, type MyPhotoAll } from '../../spots/photos-api'
import { fetchHunts, fetchMyHuntState, type MyHuntState } from '../../hunts/hunts-api'
import { huntStatus, isOpen, type Hunt } from '../../hunts/hunts'
import { Medallion } from './Medallion'
import LadderSheet from './LadderSheet'
import ClientLists from './ClientLists'

export function initialsFromEmail(email: string | null | undefined): string {
  if (!email) return '?'
  const local = email.split('@')[0]
  const segs = local.split(/[._+-]+/).filter(Boolean)
  const letters = segs.length >= 2 ? `${segs[0][0]}${segs[1][0]}` : local.slice(0, 2)
  return letters.toUpperCase() || '?'
}

const fmt = (n: number) => n.toLocaleString('en-US')
const Chevron = () => <IconChevronRight size={14} color="var(--ink-3)" />

/* The You tab (IA redesign 1h "Ledger" + 2a): the identity space. Craft
   medallion over stats over client work, with everything that used to live
   on Saved one row away. */
export default function YouScreen() {
  const nav = useNavigate()
  const user = useAuth((s) => s.user)
  const wishlist = useStore((s) => s.wishlist)
  const visited = useStore((s) => s.visited)
  const region = useStore((s) => s.region)
  const [pointEvents, setPointEvents] = useState<PointEvent[]>([])
  const [ladderOpen, setLadderOpen] = useState(false)
  const [shots, setShots] = useState<MyPhotoAll[] | null>(null)
  const [hunts, setHunts] = useState<Hunt[]>([])
  const [huntState, setHuntState] = useState<MyHuntState>({ joins: [], progress: [] })

  const points = pointsTotal(pointEvents)
  const { tier, next, ptsToNext, fraction } = tierProgress(points)
  const progress = savedProgress(visited)

  useEffect(() => {
    if (!user) { setShots(null); setPointEvents([]); setHuntState({ joins: [], progress: [] }); return }
    let alive = true
    listAllMyPhotos().then((p) => { if (alive) setShots(p) })
    // Points live server-side (B11): minted only by validated RPCs.
    fetchMyPointEvents().then((ev) => { if (alive) setPointEvents(ev) })
    fetchMyHuntState().then((s) => { if (alive) setHuntState(s) })
    return () => { alive = false }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return
    let alive = true
    fetchHunts(region).then((h) => { if (alive) setHunts(h) })
    return () => { alive = false }
  }, [region, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const now = new Date()
  const activeHunts = hunts
    .map((h) => ({ hunt: h, status: huntStatus(h, huntState.progress.filter((p) => p.huntId === h.id)) }))
    .filter(({ hunt, status }) => huntState.joins.includes(hunt.id) && !status.finished && isOpen(hunt, now))

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 14px' }}>
        <div
          aria-hidden
          style={{
            width: 54, height: 54, borderRadius: '50%', background: 'var(--terracotta-soft)',
            color: 'var(--terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 500, flex: 'none',
          }}
        >
          {user ? initialsFromEmail(user.email) : <IconUser size={24} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 20 }}>{user ? user.email?.split('@')[0] ?? 'You' : 'You'}</h2>
          {!user && authAvailable() && (
            <p className="small muted" style={{ margin: '3px 0 0' }}>
              Browsing as a guest —{' '}
              <button
                onClick={() => nav('/settings')}
                style={{ appearance: 'none', border: 0, background: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'var(--terracotta)', textDecoration: 'underline' }}
              >
                sign in
              </button>{' '}
              to sync and keep your points
            </p>
          )}
        </div>
      </div>

      <button
        className="card"
        aria-label={`Craft level: ${tier.name}`}
        onClick={() => setLadderOpen(true)}
        style={{ width: '100%', textAlign: 'left', padding: 14, display: 'flex', alignItems: 'center', gap: 14, border: '0.5px solid var(--amber)', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}
      >
        <Medallion tier={tier} size={56} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18 }}>{tier.name}</span>
            <span className="small muted">{fmt(points)} pts</span>
          </span>
          <span className="progressbar" style={{ display: 'block', margin: '8px 0 5px' }}>
            <span className="progressfill" style={{ width: `${Math.round(fraction * 100)}%`, background: 'var(--amber)' }} />
          </span>
          <span className="small tertiary">{next ? `${fmt(ptsToNext)} pts to ${next.name}` : 'Top of the ladder'}</span>
        </span>
        <Chevron />
      </button>

      {/* The tiles ARE the navigation (feedback 2026-07-16) — no duplicate
          "Saved spots" / "Your shots" rows below. */}
      <section aria-label="Your numbers" className="stats" style={{ marginTop: 10 }}>
        <button className="stat" onClick={() => nav('/you/saved')}>
          <p className="sv">{wishlist.length}</p><p className="sl">Saved</p>
        </button>
        <button className="stat" onClick={() => nav('/you/saved')}>
          <p className="sv">{visited.length}</p><p className="sl">Been there</p>
        </button>
        <button className="stat" onClick={() => nav('/you/shots')}>
          <p className="sv">{user && shots ? shots.length : '—'}</p><p className="sl">Shots</p>
        </button>
      </section>

      {progress.length > 0 && visited.length > 0 && (
        <section aria-label="Shot progress" className="card progresscard" style={{ margin: '10px 0 0' }}>
          {progress.map((p) => (
            <div key={p.regionId} className="progressrow">
              <span className="progresslabel">{p.label}</span>
              <span className="progressbar">
                <span className="progressfill" style={{ width: `${p.total ? Math.round((p.done / p.total) * 100) : 0}%` }} />
              </span>
              <span className="small muted progresscount">{p.done}/{p.total}</span>
            </div>
          ))}
        </section>
      )}

      {user && <ClientLists />}

      {user ? (
        <>
          <p className="shdr">PHOTO HUNTS</p>
          {activeHunts.map(({ hunt, status }) => (
            <button key={hunt.id} className="linkrow" style={{ marginBottom: 8 }} onClick={() => nav(`/hunts/${hunt.id}`)}>
              <span>{hunt.title} — active</span>
              <span className="val small">{status.done} of {status.total} stops <Chevron /></span>
            </button>
          ))}
          <button className="linkrow" onClick={() => nav('/hunts')}>
            <span className={activeHunts.length ? 'muted' : undefined}>Browse all hunts</span>
            <span className="val"><Chevron /></span>
          </button>
        </>
      ) : (
        <button className="linkrow" style={{ marginTop: 14 }} onClick={() => nav('/hunts')}>
          <span>Photo hunts</span>
          <span className="val"><Chevron /></span>
        </button>
      )}

      <div className="card list" style={{ marginTop: 14 }}>
        <button className="row" onClick={() => nav('/settings')}>
          <span className="rowleft">Settings</span>
          <span className="val"><Chevron /></span>
        </button>
      </div>

      {ladderOpen && <LadderSheet points={points} onClose={() => setLadderOpen(false)} />}
    </div>
  )
}
