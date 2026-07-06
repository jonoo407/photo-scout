import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IconMapPin, IconStar, IconStarFilled, IconSunset2 } from '@tabler/icons-react'
import { useAllSpots } from '../../state/useRegion'
import { parseShortlist, bestLightWindow } from '../../spots/shortlist'
import { fetchSharedShortlist, submitShortlistResponse, type SharedShortlist } from '../../spots/shortlist-api'
import { fmtRange, fmtTime } from '../../util/format'
import { getRegion } from '../../data/regions'
import type { Spot } from '../../spots/types'

/* The page a photographer's CLIENT opens — deliberately chrome-free (no tab
   bar, no want/been buttons, no craft jargon). v1 links carry the spot ids in
   the URL; v2 stored lists (?id=uuid) add the photographer's notes and let the
   client pick favorites + send a comment back, no account needed. */
export default function ClientListScreen() {
  const [params] = useSearchParams()
  const { ids: inlineIds, title: inlineTitle, listId } = parseShortlist(params)
  const { spots: all, loading } = useAllSpots()
  const now = useMemo(() => new Date(), [])

  // Stored-list fetch (v2). 'idle' = inline v1 link, no fetch.
  const [stored, setStored] = useState<'idle' | 'loading' | 'missing' | SharedShortlist>(listId ? 'loading' : 'idle')
  useEffect(() => {
    if (!listId) return
    let alive = true
    fetchSharedShortlist(listId)
      .then((l) => { if (alive) setStored(l ?? 'missing') })
      .catch(() => { if (alive) setStored('missing') })
    return () => { alive = false }
  }, [listId])

  // Client response state (stored lists only)
  const [picked, setPicked] = useState<string[]>([])
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const storedList = typeof stored === 'object' ? stored : null
  const ids = storedList ? storedList.spots.map((s) => s.id) : inlineIds
  const noteById = new Map(storedList?.spots.flatMap((s) => (s.note ? [[s.id, s.note] as const] : [])) ?? [])
  const title = storedList ? storedList.title : inlineTitle

  const byId = new Map(all.map((s) => [s.id, s]))
  const spots = ids.map((id) => byId.get(id)).filter(Boolean) as Spot[]

  if (stored === 'loading' || (loading && spots.length < ids.length)) {
    return <div className="screen clientpage"><p className="center-note">Loading…</p></div>
  }

  const togglePick = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const canSend = picked.length > 0 || comment.trim().length > 0

  const send = async () => {
    if (!listId || !canSend) return
    setSendState('sending')
    try {
      const payload: { picked: string[]; clientName?: string; comment?: string } = { picked }
      if (name.trim()) payload.clientName = name.trim()
      if (comment.trim()) payload.comment = comment.trim()
      await submitShortlistResponse(listId, payload)
      setSendState('sent')
    } catch {
      setSendState('error')
    }
  }

  return (
    <div className="screen clientpage">
      <header>
        <p className="clientbrand">Vantage</p>
        <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>{title ?? 'Location options'}</h1>
        {spots.length > 0 && (
          <p className="clientsub">
            {spots.length} location {spots.length === 1 ? 'option' : 'options'} for your shoot —
            {storedList
              ? ' pick your favorites below and send them back.'
              : ' tell your photographer which one you like.'}
          </p>
        )}
      </header>

      {spots.length === 0 && (
        <div className="empty">
          <IconMapPin size={30} />
          <p className="et">This link doesn't have any locations</p>
          <p className="es">Ask your photographer to resend it.</p>
        </div>
      )}

      {spots.map((spot, i) => {
        const photo = spot.media[0]
        const tz = getRegion(spot.region).timeZone
        const w = bestLightWindow(spot, now)
        const when = w.start && w.end
          ? `${w.label} · ${fmtRange(w.start, w.end, tz)}`
          : w.start
            ? `${w.label} · from ${fmtTime(w.start, tz)}`
            : w.label
        const note = noteById.get(spot.id)
        const isPicked = picked.includes(spot.id)
        return (
          <article className="clientcard" key={spot.id}>
            {photo && <img className="clientphoto" src={photo.src} alt={spot.name} loading="lazy" decoding="async" />}
            <div className="clientbody">
              <p className="optnum">Option {i + 1}</p>
              <h2>{spot.name}</h2>
              <p className="clientwhy">{spot.bestFor.join(' · ')}</p>
              <p className="clientlight"><IconSunset2 size={15} /> Best light: {when}</p>
              <a
                className="addresslink"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.address)}`}
                target="_blank" rel="noreferrer"
              >
                <IconMapPin size={13} /> {spot.address}
              </a>
              {note && <p className="clientnote">"{note}" — your photographer</p>}
              {storedList && (
                <button className={`pickbtn ${isPicked ? 'on' : ''}`} onClick={() => togglePick(spot.id)}>
                  {isPicked ? <IconStarFilled size={15} /> : <IconStar size={15} />}
                  {isPicked ? 'Your pick' : 'Pick this one'}
                </button>
              )}
            </div>
          </article>
        )
      })}

      {storedList && spots.length > 0 && (
        <div className="card clientrespond">
          <p className="ct">Tell your photographer</p>
          {sendState === 'sent' ? (
            <>
              <p className="small" style={{ color: 'var(--go-ink)', margin: 0 }}>
                Sent to your photographer! They'll see your pick.
              </p>
              <button className="chip act" onClick={() => setSendState('idle')}>Send an update</button>
            </>
          ) : (
            <>
              <input
                className="addrinput pickertitle"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <textarea
                className="addrinput pickertitle notearea"
                placeholder="Anything to add? (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button className="chip on" disabled={!canSend || sendState === 'sending'} onClick={() => void send()}>
                Send to your photographer
              </button>
              {sendState === 'error' && (
                <p className="small" style={{ color: 'var(--skip-ink)', margin: 0 }}>Couldn't send — try again.</p>
              )}
            </>
          )}
        </div>
      )}

      <footer className="clientfoot">
        {spots.length > 0 && <p className="small tertiary">Light windows are for today at each location.</p>}
        <p className="small">Scouted with <a href="https://shootvantage.com">Vantage</a></p>
      </footer>
    </div>
  )
}
