import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconShare2, IconCamera, IconChevronRight } from '@tabler/icons-react'
import { useAuth } from '../../auth/useAuth'
import { authAvailable } from '../../auth/supabase'
import { useRegion } from '../../state/useRegion'
import { CANDIDATE_CITIES } from '../../community/cities'
import { fetchVoteTotals, fetchMyVote, castVote } from '../../community/votes-api'
import { shareLink } from '../../util/share'

const SCOREBOARD_URL = 'https://shootvantage.com/#/community'

/* Community, day one (IA redesign 1j): seeded with the next-city scoreboard
   (B12) — real votes, no fabricated counts — plus an honest list of what's
   coming to the tab. Discussions (B8) and critiques (B13) grow in here
   without moving anything. */
export default function CommunityScreen() {
  const nav = useNavigate()
  const user = useAuth((s) => s.user)
  const region = useRegion()
  const [totals, setTotals] = useState<Record<string, number> | null | 'loading'>('loading')
  const [myVote, setMyVote] = useState<string | null>(null)
  const [choosing, setChoosing] = useState(false)

  useEffect(() => {
    let alive = true
    void fetchVoteTotals().then((t) => { if (alive) setTotals(t) })
    return () => { alive = false }
  }, [])
  useEffect(() => {
    if (!user) { setMyVote(null); return }
    let alive = true
    void fetchMyVote().then((v) => { if (alive) setMyVote(v) })
    return () => { alive = false }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const counts = totals === 'loading' || totals === null ? null : totals
  const ranked = useMemo(() => {
    const rows = CANDIDATE_CITIES.map((c) => ({ ...c, votes: counts?.[c.id] ?? 0 }))
    return counts ? rows.sort((a, b) => b.votes - a.votes) : rows
  }, [counts])
  const maxVotes = Math.max(1, ...ranked.map((r) => r.votes))

  // B12 playful copy: how far the runner-up is from taking the lead.
  const overtake = useMemo(() => {
    if (!counts) return null
    const [leader, runner] = ranked
    if (!leader || !runner || leader.votes === 0 || leader.votes <= runner.votes) return null
    return `${runner.label} needs ${leader.votes - runner.votes + 1} more votes to overtake ${leader.label}.`
  }, [counts, ranked])

  const choose = async (cityId: string) => {
    setChoosing(false)
    const prev = myVote
    setMyVote(cityId) // optimistic — the pill moves immediately
    const ok = await castVote(cityId)
    if (!ok) { setMyVote(prev); return }
    const t = await fetchVoteTotals()
    if (t) setTotals(t)
  }

  return (
    <div className="screen">
      <p className="eyebrow" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 12 }}>{region.label}</p>
      <h1>Community</h1>

      <div className="hero-card">
        <p className="hero-label">NEXT CITY SCOREBOARD</p>
        <div className="hero-title"><span className="t">Where does Vantage go next?</span></div>
        <p className="hero-sub">One vote per person — the winner becomes the next city we scout.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '14px 0 4px' }}>
          {ranked.map((c, i) => (
            <div key={c.id} className="progressrow">
              <span className="progresslabel">{c.label}</span>
              <span className="progressbar">
                <span
                  className="progressfill"
                  style={{ width: counts ? `${Math.round((c.votes / maxVotes) * 100)}%` : '0%', background: i === 0 && counts ? 'var(--amber)' : undefined }}
                />
              </span>
              <span className="small progresscount" style={i === 0 && counts ? { fontWeight: 500 } : undefined}>
                {counts ? c.votes : '—'}
              </span>
              {myVote === c.id && <span className="pill go" style={{ flex: 'none' }}>your vote</span>}
            </div>
          ))}
        </div>

        {counts === null && totals !== 'loading' && (
          <p className="small tertiary" style={{ margin: '6px 0 0' }}>Live tallies unavailable right now — try again in a bit.</p>
        )}
        {overtake && <p className="small muted" style={{ margin: '8px 0 0' }}>{overtake}</p>}

        {authAvailable() && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!user ? (
              <button className="cta" onClick={() => nav('/settings')}>Sign in to vote</button>
            ) : choosing ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CANDIDATE_CITIES.map((c) => (
                  <button key={c.id} className={`chip ${myVote === c.id ? 'on' : ''}`} onClick={() => void choose(c.id)}>
                    {c.label}
                  </button>
                ))}
                <button className="chip" onClick={() => setChoosing(false)}>Cancel</button>
              </div>
            ) : (
              <button className="cta" onClick={() => setChoosing(true)}>
                {myVote ? 'Change vote' : 'Cast your vote'}
              </button>
            )}
            <button
              className="chip act"
              style={{ alignSelf: 'center' }}
              onClick={() => void shareLink('Vote for the next Vantage city', SCOREBOARD_URL)}
            >
              <IconShare2 size={14} /> Invite friends to vote
            </button>
          </div>
        )}
      </div>

      <button className="linkrow" style={{ marginTop: 14 }} onClick={() => nav('/hunts')}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <IconCamera size={16} color="var(--terracotta)" /> Photo hunts — earn points on a shoot crawl
        </span>
        <IconChevronRight size={16} color="var(--ink-3)" />
      </button>

      <p className="shdr">COMING TO THIS TAB</p>
      {/* No opacity dim here: it pushed the muted text + pills below WCAG
          contrast (axe, 2026-07-16). The muted palette is subdued enough. */}
      <div className="card list">
        <div className="row"><span className="rowleft muted">Spot discussions</span><span className="pill info">soon</span></div>
        <div className="row"><span className="rowleft muted">Photo critiques</span><span className="pill info">soon</span></div>
      </div>
    </div>
  )
}
