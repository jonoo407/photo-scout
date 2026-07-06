import { useEffect, useRef, useState } from 'react'
import { IconStar, IconCircleCheck, IconCamera, IconShare2, IconSend } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { useAuth } from '../../auth/useAuth'
import { authAvailable } from '../../auth/supabase'
import { useSpotsByIds } from '../../state/useRegion'
import { SpotCard } from '../SpotCard'
import { shortlistUrl, storedShortlistUrl, buildListSpots, MAX_SHORTLIST } from '../../spots/shortlist'
import { savedProgress } from '../../spots/progress'
import { createShortlist, deleteShortlist, fetchMyShortlists, type MyShortlist } from '../../spots/shortlist-api'
import { shareLink } from '../../util/share'
import { fmtDay } from '../../util/format'
import type { Spot } from '../../spots/types'

/* The user's own map of the app: want-to-go, been-there, and shot progress.
   Spans every city (saved spots keep working when you switch regions).
   Also home of the client-shortlist builder: pick a few saved spots (signed in:
   with per-spot notes, stored in Supabase) and send the client one chrome-free
   /list link. Client responses land back here under "Client lists". */
export default function SavedScreen() {
  const wishlist = useStore((s) => s.wishlist)
  const visited = useStore((s) => s.visited)
  const checklist = useStore((s) => s.checklist)
  const user = useAuth((s) => s.user)
  const [lists, setLists] = useState<MyShortlist[] | null>(null)
  // Load only the cities our saved/list spots actually live in.
  const neededIds = [
    ...wishlist, ...visited,
    ...(lists ?? []).flatMap((l) => l.spots.map((s) => s.id)),
  ]
  const { byId, loading } = useSpotsByIds(neededIds)
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [title, setTitle] = useState('')
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState(false)
  const [armedDelete, setArmedDelete] = useState<string | null>(null)
  // Snapshot last-seen at mount: NEW pills stay visible this visit even though
  // viewing the section immediately records everything as seen.
  const seenAtRef = useRef(useStore.getState().listsSeenAt)

  useEffect(() => {
    if (!user) { setLists(null); return }
    let alive = true
    fetchMyShortlists()
      .then((ls) => {
        if (!alive) return
        setLists(ls)
        useStore.getState().markListsSeen()
      })
      .catch(() => {}) // offline / table missing — section just stays hidden
    return () => { alive = false }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const pickNames = (r: { picked: string[] }) =>
    r.picked.map((id) => byId.get(id)?.name ?? id).join(', ')

  const isNewResponse = (createdAt: string) => !seenAtRef.current || createdAt > seenAtRef.current

  const empty = !loading && want.length === 0 && been.length === 0

  return (
    <div className="screen">
      <div className="row-spread">
        <h1>Saved</h1>
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
          <section aria-label="Shot progress" className="card progresscard">
            {savedProgress(visited).map((p) => (
              <div key={p.regionId} className="progressrow">
                <span className="progresslabel">{p.label}</span>
                <span className="progressbar">
                  <span
                    className="progressfill"
                    style={{ width: `${p.total ? Math.round((p.done / p.total) * 100) : 0}%` }}
                  />
                </span>
                <span className="small muted progresscount">{p.done}/{p.total}</span>
              </div>
            ))}
          </section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {been.map(card)}
          </div>
        </>
      )}

      {user && lists && lists.length > 0 && (
        <>
          <p className="bucket" style={{ marginTop: 18 }}><IconSend size={15} color="var(--terracotta)" /> Client lists</p>
          {lists.map((l) => (
            <div key={l.id} className="card clist">
              <div className="row-spread" style={{ alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <p className="clist-title">{l.title ?? 'Location options'}</p>
                  <p className="small muted" style={{ margin: '2px 0 0' }}>
                    {l.spots.length} {l.spots.length === 1 ? 'spot' : 'spots'} · sent {fmtDay(new Date(l.createdAt))}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                  <button className="chip act" onClick={() => void shareLink(l.title ?? 'Location options', storedShortlistUrl(l.id))}>
                    Copy link
                  </button>
                  <button
                    className="chip act"
                    onClick={() => {
                      if (armedDelete === l.id) {
                        void deleteShortlist(l.id)
                        setLists((ls) => (ls ?? []).filter((x) => x.id !== l.id))
                        setArmedDelete(null)
                      } else {
                        setArmedDelete(l.id)
                      }
                    }}
                  >
                    {armedDelete === l.id ? 'Confirm delete' : 'Delete'}
                  </button>
                </div>
              </div>
              {l.responses.length === 0 ? (
                <p className="small muted" style={{ margin: '8px 0 0' }}>No response yet</p>
              ) : (
                l.responses.map((r) => (
                  <div key={r.id} className="resp">
                    <p className="resp-pick">
                      {isNewResponse(r.createdAt) && <span className="pill go">New</span>}
                      <IconStar size={14} color="var(--maybe-ink)" />{' '}
                      {r.picked.length > 0 ? pickNames(r) : 'No pick'}
                      {r.clientName ? ` — ${r.clientName}` : ''}
                    </p>
                    {r.comment && <p className="resp-comment">"{r.comment}"</p>}
                    <p className="small tertiary" style={{ margin: '2px 0 0' }}>{fmtDay(new Date(r.createdAt))}</p>
                  </div>
                ))
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
