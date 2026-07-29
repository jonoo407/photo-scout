import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconShieldCheck, IconUserOff, IconChevronRight } from '@tabler/icons-react'
import { fetchBlockedCount, unblockEveryone } from '../../spots/photo-reports-api'

/* Settings → Community & safety (V1, guideline 1.2): the block list has to be
   undoable somewhere, and the guidelines have to be findable without first
   finding a shot to report. */
export default function SafetySection() {
  const [blocked, setBlocked] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    void fetchBlockedCount().then((n) => { if (alive) setBlocked(n) })
    return () => { alive = false }
  }, [])

  const unblockAll = async () => {
    setBusy(true)
    const ok = await unblockEveryone()
    setBusy(false)
    if (ok) setBlocked(0)
  }

  return (
    <>
      <p className="shdr">COMMUNITY &amp; SAFETY</p>
      <div className="card list">
        <Link className="row" to="/guidelines">
          <span className="rowleft"><IconShieldCheck size={18} /> Community guidelines</span>
          <IconChevronRight size={16} className="val" />
        </Link>
        <div className="row last">
          <span className="rowleft"><IconUserOff size={18} /> Blocked photographers</span>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="val small">
              {blocked === null ? '…' : blocked === 0 ? 'Nobody blocked' : `${blocked} blocked`}
            </span>
            {!!blocked && (
              <button className="chip" onClick={() => void unblockAll()} disabled={busy}>
                {busy ? '…' : 'Unblock all'}
              </button>
            )}
          </span>
        </div>
      </div>
    </>
  )
}
