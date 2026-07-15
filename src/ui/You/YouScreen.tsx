import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconChevronRight, IconUser } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { useAuth } from '../../auth/useAuth'
import { authAvailable } from '../../auth/supabase'
import { pointsTotal } from '../../craft/points'
import { tierProgress } from '../../craft/tiers'
import { savedProgress } from '../../spots/progress'
import { listAllMyPhotos, type MyPhotoAll } from '../../spots/photos-api'
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
  const pointEvents = useStore((s) => s.pointEvents)
  const [ladderOpen, setLadderOpen] = useState(false)
  const [shots, setShots] = useState<MyPhotoAll[] | null>(null)

  const points = pointsTotal(pointEvents)
  const { tier, next, ptsToNext, fraction } = tierProgress(points)
  const progress = savedProgress(visited)

  useEffect(() => {
    if (!user) { setShots(null); return }
    let alive = true
    listAllMyPhotos().then((p) => { if (alive) setShots(p) })
    return () => { alive = false }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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

      <section aria-label="Your numbers" className="stats" style={{ marginTop: 10 }}>
        <div className="stat"><p className="sv">{wishlist.length}</p><p className="sl">Saved</p></div>
        <div className="stat"><p className="sv">{visited.length}</p><p className="sl">Been there</p></div>
        <div className="stat"><p className="sv">{user && shots ? shots.length : '—'}</p><p className="sl">Shots</p></div>
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

      <div className="card list" style={{ marginTop: 14 }}>
        {user && (
          <button className="row" onClick={() => nav('/you/shots')}>
            <span className="rowleft">Your shots</span>
            <span className="val small">{shots ? shots.length : ''} <Chevron /></span>
          </button>
        )}
        <button className="row" onClick={() => nav('/you/saved')}>
          <span className="rowleft">Saved spots</span>
          <span className="val small">{wishlist.length} <Chevron /></span>
        </button>
        <button className="row" onClick={() => nav('/settings')}>
          <span className="rowleft">Settings</span>
          <span className="val"><Chevron /></span>
        </button>
      </div>

      {ladderOpen && <LadderSheet points={points} onClose={() => setLadderOpen(false)} />}
    </div>
  )
}
