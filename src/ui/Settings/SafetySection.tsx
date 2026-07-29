import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconShieldCheck, IconUserOff, IconChevronRight } from '@tabler/icons-react'
import {
  fetchBlockedPhotographers, unblockPhotographer, type BlockedPhotographer,
} from '../../spots/photo-reports-api'

/* Settings → Community & safety (V1, guideline 1.2).

   The list is per-row undoable (2026-07-29). It shipped a day earlier as a
   bare count with one Unblock all, because blocking was keyed off a photo and
   the client had no handle for a person — so an accidental block could only be
   undone by unblocking everyone. Opaque refs fixed that. */
export default function SafetySection() {
  const [blocked, setBlocked] = useState<BlockedPhotographer[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void fetchBlockedPhotographers().then((b) => { if (alive) setBlocked(b) })
    return () => { alive = false }
  }, [])

  const unblock = async (ref: string) => {
    setBusy(ref)
    const res = await unblockPhotographer(ref)
    setBusy(null)
    // Drop the row only once the server agrees — otherwise a failed unblock
    // looks like it worked until the next reload.
    if (res.ok) setBlocked((b) => (b ?? []).filter((p) => p.ref !== ref))
  }

  return (
    <>
      <p className="shdr">COMMUNITY &amp; SAFETY</p>
      <div className="card list">
        <Link className="row" to="/guidelines">
          <span className="rowleft"><IconShieldCheck size={18} /> Community guidelines</span>
          <IconChevronRight size={16} className="val" />
        </Link>

        {blocked === null ? (
          <div className="row last">
            <span className="rowleft"><IconUserOff size={18} /> Blocked photographers</span>
            <span className="val small">…</span>
          </div>
        ) : blocked.length === 0 ? (
          <div className="row last">
            <span className="rowleft"><IconUserOff size={18} /> Blocked photographers</span>
            <span className="val small">Nobody blocked</span>
          </div>
        ) : (
          <>
            <div className="row">
              <span className="rowleft"><IconUserOff size={18} /> Blocked photographers</span>
              <span className="val small">{blocked.length}</span>
            </div>
            {blocked.map((p, i) => (
              <div className={`row ${i === blocked.length - 1 ? 'last' : ''}`} key={p.ref}>
                <span className="rowleft">
                  <span className="commshot-owner" style={{ marginLeft: 0 }}>{p.initials}</span>
                  <span className="small tertiary">
                    blocked {new Date(p.blockedAt).toLocaleDateString()}
                  </span>
                </span>
                <button className="chip" onClick={() => void unblock(p.ref)} disabled={busy === p.ref}>
                  {busy === p.ref ? '…' : 'Unblock'}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  )
}
