import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconStar, IconCircleCheck, IconCamera, IconShare2, IconChevronLeft } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { useAuth } from '../../auth/useAuth'
import { authAvailable } from '../../auth/supabase'
import { useSpotsByIds } from '../../state/useRegion'
import { SpotCard } from '../SpotCard'
import { shortlistUrl, storedShortlistUrl, buildListSpots, MAX_SHORTLIST } from '../../spots/shortlist'
import { createShortlist } from '../../spots/shortlist-api'
import { shareLink } from '../../util/share'
import type { Spot } from '../../spots/types'

/* Saved spots — now a You sub-screen (IA redesign 1h): want-to-go and
   been-there lists spanning every city, plus the client-shortlist builder.
   Client lists + responses and the per-city progress bars moved up to /you. */
export default function SavedScreen() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const wishlist = useStore((s) => s.wishlist)
  const visited = useStore((s) => s.visited)
  const checklist = useStore((s) => s.checklist)
  const user = useAuth((s) => s.user)
  const neededIds = [...wishlist, ...visited]
  const { byId, loading } = useSpotsByIds(neededIds)
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [title, setTitle] = useState('')
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState(false)

  // "+ New client shortlist" on You deep-links straight into pick mode.
  useEffect(() => {
    if (params.get('pick')) setPicking(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const want = wishlist.map((id) => byId.get(id)).filter(Boolean) as Spot[]
  const been = visited.map((id) => byId.get(id)).filter(Boolean) as Spot[]

  const togglePick = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < MAX_SHORTLIST ? [...p, id] : p))

  const stopPicking = () => { setPicking(false); setPicked([]); setNotes({}); setCopied(false); setShareError(false) }

  const share = async () => {
    setShareError(false)
    try {
      // Signed in → store the list (notes + client responses); else v1 URL-only.
      const url = user
        ? storedShortlistUrl(await createShortlist(title.trim() || null, buildListSpots(picked, notes)))
        : shortlistUrl(picked, title)
      const result = await shareLink(title.trim() || 'Location options', url)
      if (result === 'copied') setCopied(true)
    } catch {
      setShareError(true)
    }
  }

  const shotMeta = (spot: Spot) => {
    const total = spot.craft.signatureShots.length
    const done = (checklist[spot.id] ?? []).filter((id) => spot.craft.signatureShots.some((s) => s.id === id)).length
    return total ? (
      <span style={done === total ? { color: 'var(--go-ink)' } : undefined}>
        <IconCamera size={14} /> {done}/{total} shots
      </span>
    ) : undefined
  }

  const card = (s: Spot) => picking ? (
    <SpotCard
      key={s.id} spot={s} reason={s.city}
      onPress={() => togglePick(s.id)}
      badge={picked.includes(s.id) ? { label: 'Added', kind: 'go' } : { label: 'Add', kind: 'info' }}
    />
  ) : (
    <SpotCard key={s.id} spot={s} reason={s.city} meta={shotMeta(s)} />
  )

  const empty = !loading && want.length === 0 && been.length === 0

  return (
    <div className="screen">
      <button className="back" onClick={() => nav('/you')}><IconChevronLeft size={16} /> You</button>
      <div className="row-spread">
        <h1>Saved spots</h1>
        {!picking && !empty && (
          <button className="chip act" onClick={() => setPicking(true)}>
            <IconShare2 size={14} /> Client shortlist
          </button>
        )}
      </div>

      {picking && (
        <div className="card picker">
          <p className="small muted" style={{ margin: 0 }}>
            Tap spots below to add them, then send your client one link with the options.
          </p>
          {authAvailable() && !user && (
            <p className="small muted" style={{ margin: 0 }}>
              Sign in (Settings → Account) to add notes and get your client's pick back.
            </p>
          )}
          {user && picked.map((id) => {
            const s = byId.get(id)
            return s ? (
              <div key={id} className="noterow">
                <span className="notename">{s.name}</span>
                <input
                  className="addrinput pickertitle"
                  aria-label={`Note for ${s.name}`}
                  placeholder="Note for client (optional)"
                  value={notes[id] ?? ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [id]: e.target.value }))}
                />
              </div>
            ) : null
          })}
          <input
            className="addrinput pickertitle"
            placeholder="List title (e.g. Smith family)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="chip on" disabled={picked.length === 0} onClick={() => void share()}>
              <IconShare2 size={14} /> Share link{picked.length > 0 ? ` (${picked.length})` : ''}
            </button>
            <button className="chip" onClick={stopPicking}>Cancel</button>
          </div>
          {copied && <p className="small" style={{ color: 'var(--go-ink)', margin: 0 }}>Link copied — text it to your client</p>}
          {shareError && <p className="small" style={{ color: 'var(--skip-ink)', margin: 0 }}>Couldn't create the list — check your connection and try again.</p>}
        </div>
      )}

      {empty && (
        <div className="empty">
          <IconStar size={30} />
          <p className="et">Nothing saved yet</p>
          <p className="es">
            On any spot, tap <strong>Want to go</strong> to build your shortlist or{' '}
            <strong>Been there</strong> to track it — everything lands here (and syncs when you're signed in).
          </p>
        </div>
      )}

      {want.length > 0 && (
        <>
          <p className="bucket"><IconStar size={15} color="var(--maybe-ink)" /> Want to go</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {want.map(card)}
          </div>
        </>
      )}

      {been.length > 0 && (
        <>
          <p className="bucket"><IconCircleCheck size={15} color="var(--go-ink)" /> Been there</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {been.map(card)}
          </div>
        </>
      )}
    </div>
  )
}
