import { IconCheck } from '@tabler/icons-react'
import { tierProgress } from '../../craft/tiers'
import type { Hunt } from '../../hunts/hunts'

const fmt = (n: number) => n.toLocaleString('en-US')

/* The hunt-complete celebration sheet (handoff 4a): the tally lands right at
   the moment of joy, with the ladder progress it just moved. (The referral
   card from the mock waits for real attribution — B11.) */
export default function HuntCompleteSheet({ hunt, totalPts, onClose }: {
  hunt: Hunt
  totalPts: number
  onClose: () => void
}) {
  const { tier, next, ptsToNext, fraction } = tierProgress(totalPts)
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Hunt complete" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden />
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--go-bg)', color: 'var(--go-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCheck size={30} />
          </span>
          <h2 style={{ fontSize: 22, margin: '12px 0 4px' }}>{hunt.title}, complete</h2>
          <p className="small muted" style={{ margin: 0 }}>All {hunt.stops.length} stops shot</p>
        </div>

        <div className="card list" style={{ marginBottom: 14 }}>
          <div className="row">
            <span className="rowleft">{hunt.stops.length} stops</span>
            <span className="val nowrap" style={{ fontWeight: 500 }}>+{fmt(hunt.stops.length * hunt.stopPts)}</span>
          </div>
          <div className="row">
            <span className="rowleft">Finish bonus</span>
            <span className="val nowrap" style={{ fontWeight: 500 }}>+{fmt(hunt.finishPts)}</span>
          </div>
          <div className="row last">
            <span className="rowleft" style={{ fontWeight: 500 }}>New total</span>
            <span className="val nowrap" style={{ fontWeight: 500 }}>{fmt(totalPts)} pts</span>
          </div>
        </div>

        <span className="progressbar" style={{ display: 'block', margin: '0 auto 6px', maxWidth: 260 }}>
          <span className="progressfill" style={{ width: `${Math.round(fraction * 100)}%`, background: 'var(--amber)' }} />
        </span>
        <p className="center-note" style={{ marginBottom: 12 }}>
          {next ? `${tier.name} · ${fmt(ptsToNext)} pts to ${next.name}` : `${tier.name} — top of the ladder`}
        </p>

        <button className="cta" onClick={onClose}>Back to hunts</button>
      </div>
    </div>
  )
}
