import { useState } from 'react'
import { IconFlag, IconUserOff } from '@tabler/icons-react'
import {
  REPORT_REASONS, reportPhoto, blockPhotographer, type ReportReason,
} from '../../spots/photo-reports-api'

/* Report / block sheet for a community shot (V1, App Review guideline 1.2).

   Two separate remedies, deliberately side by side: reporting is about the
   CONTENT and goes to a curator; blocking is about the PERSON and takes effect
   for you alone, instantly, with nobody's judgement in the loop. Someone being
   harassed should not have to wait on a review queue to stop seeing them. */

export type SheetOutcome =
  | { kind: 'reported'; hidden: boolean }
  | { kind: 'blocked' }

export default function ReportShotSheet({
  photoId, ownerRef, onClose, onDone,
}: {
  photoId: string
  /** Opaque photographer handle from the listing. Null only for rows that
      predate refs, in which case blocking is simply not offered. */
  ownerRef: string | null
  onClose: () => void
  onDone: (outcome: SheetOutcome) => void
}) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!reason || busy) return
    setBusy(true); setError(null)
    const res = await reportPhoto(photoId, reason, note)
    setBusy(false)
    if (!res.ok) { setError(res.message); return }
    onDone({ kind: 'reported', hidden: res.hidden })
  }

  const block = async () => {
    if (busy || !ownerRef) return
    setBusy(true); setError(null)
    const res = await blockPhotographer(ownerRef)
    setBusy(false)
    if (!res.ok) { setError(res.message); return }
    onDone({ kind: 'blocked' })
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Report this shot" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden />
        <h2 style={{ fontSize: 19, margin: '4px 0 2px' }}>Report this shot</h2>

        {/* Block sits first, deliberately. It is the one action that works
            instantly and needs nobody's review — someone being harassed should
            not have to scroll past a taxonomy to reach it. */}
        {ownerRef && (
          <>
            <button
              className="chip"
              onClick={() => void block()}
              disabled={busy}
              style={{ width: '100%', margin: '10px 0 4px', color: 'var(--skip-ink)' }}
            >
              <IconUserOff size={15} /> Block this photographer
            </button>
            <p className="small tertiary" style={{ margin: '0 2px 14px', textAlign: 'center' }}>
              Hides every shot of theirs from you, everywhere. Undo in Settings.
            </p>
          </>
        )}

        <p className="small muted" style={{ margin: '0 2px 8px' }}>
          Or tell a curator what's wrong — two independent reports hide a shot straight away.
        </p>

        <div className="card list" role="radiogroup" aria-label="Reason">
          {REPORT_REASONS.map((r) => (
            <label key={r.id} className="row" style={{ cursor: 'pointer' }}>
              <span className="rowleft">
                <input
                  type="radio"
                  name="report-reason"
                  value={r.id}
                  checked={reason === r.id}
                  onChange={() => setReason(r.id)}
                  style={{ accentColor: 'var(--terracotta)' }}
                />
                <span>
                  {r.label}
                  <span className="small tertiary" style={{ display: 'block' }}>{r.hint}</span>
                </span>
              </span>
            </label>
          ))}
        </div>

        <label htmlFor="report-note" className="shdr" style={{ display: 'block', marginTop: 14 }}>
          ANYTHING TO ADD? (OPTIONAL)
        </label>
        <textarea
          id="report-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="What should the curator know?"
          style={{ width: '100%', font: 'inherit', padding: 10, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)', color: 'inherit' }}
        />

        {error && <p className="small" style={{ color: 'var(--skip-ink)', margin: '8px 2px 0' }}>{error}</p>}

        <button className="cta" onClick={() => void submit()} disabled={!reason || busy} style={{ marginTop: 12 }}>
          <IconFlag size={15} /> Report
        </button>
        <button className="chip" onClick={onClose} disabled={busy} style={{ width: '100%', marginTop: 8 }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
