import { useState } from 'react'
import { IconStar, IconCircleCheck, IconCamera, IconShare2 } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { useAllSpots } from '../../state/useRegion'
import { SpotCard } from '../SpotCard'
import { shortlistUrl, MAX_SHORTLIST } from '../../spots/shortlist'
import { shareLink } from '../../util/share'
import type { Spot } from '../../spots/types'

/* The user's own map of the app: want-to-go, been-there, and shot progress.
   Spans every city (saved spots keep working when you switch regions).
   Also home of the client-shortlist builder: pick a few saved spots and send
   the client one chrome-free /list link with the options. */
export default function SavedScreen() {
  const wishlist = useStore((s) => s.wishlist)
  const visited = useStore((s) => s.visited)
  const checklist = useStore((s) => s.checklist)
  const { spots, loading } = useAllSpots()
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [copied, setCopied] = useState(false)

  const byId = new Map(spots.map((s) => [s.id, s]))
  const want = wishlist.map((id) => byId.get(id)).filter(Boolean) as Spot[]
  const been = visited.map((id) => byId.get(id)).filter(Boolean) as Spot[]

  const togglePick = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < MAX_SHORTLIST ? [...p, id] : p))

  const stopPicking = () => { setPicking(false); setPicked([]); setCopied(false) }

  const share = async () => {
    // Picked order = the order the photographer tapped = the order the client sees.
    const result = await shareLink(title.trim() || 'Location options', shortlistUrl(picked, title))
    if (result === 'copied') setCopied(true)
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
      <div className="row-spread">
        <h1>Saved</h1>
        {!picking && !empty && (
          <button className="chip" onClick={() => setPicking(true)}>
            <IconShare2 size={14} /> Client shortlist
          </button>
        )}
      </div>

      {picking && (
        <div className="card picker">
          <p className="small muted" style={{ margin: 0 }}>
            Tap spots below to add them, then send your client one link with the options.
          </p>
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
