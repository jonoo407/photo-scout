import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconStar, IconShare2 } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { useAuth } from '../../auth/useAuth'
import { useSpotsByIds } from '../../state/useRegion'
import { storedShortlistUrl } from '../../spots/shortlist'
import { deleteShortlist, fetchMyShortlists, type MyShortlist } from '../../spots/shortlist-api'
import { shareLink } from '../../util/share'
import { fmtDay } from '../../util/format'

/* CLIENT WORK on the You tab (IA redesign 1h/2a — moved here from Saved:
   responses are notifications, and notifications belong on the identity tab).
   Lists + responses + the entry into the shortlist builder on /you/saved. */
export default function ClientLists() {
  const nav = useNavigate()
  const user = useAuth((s) => s.user)
  const [lists, setLists] = useState<MyShortlist[] | null>(null)
  const [armedDelete, setArmedDelete] = useState<string | null>(null)
  // Snapshot last-seen at mount: NEW pills stay visible this visit even though
  // viewing the section immediately records everything as seen.
  const seenAtRef = useRef(useStore.getState().listsSeenAt)
  const { byId } = useSpotsByIds((lists ?? []).flatMap((l) => l.spots.map((s) => s.id)))

  useEffect(() => {
    if (!user) { setLists(null); return }
    let alive = true
    fetchMyShortlists()
      .then((ls) => {
        if (!alive) return
        setLists(ls)
        useStore.getState().markListsSeen()
      })
      .catch(() => {}) // offline / table missing — section just stays lean
    return () => { alive = false }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null

  const pickNames = (r: { picked: string[] }) =>
    r.picked.map((id) => byId.get(id)?.name ?? id).join(', ')
  const isNewResponse = (createdAt: string) => !seenAtRef.current || createdAt > seenAtRef.current

  return (
    <>
      <p className="shdr">CLIENT WORK</p>
      {(lists ?? []).map((l) => (
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
      {lists !== null && lists.length === 0 && (
        <p className="small muted" style={{ margin: '0 2px 8px' }}>
          Pick a few saved spots and send your client one link with the options.
        </p>
      )}
      <button className="chip act" style={{ alignSelf: 'flex-start' }} onClick={() => nav('/you/saved?pick=1')}>
        <IconShare2 size={14} /> New client shortlist
      </button>
    </>
  )
}
