import { Link } from 'react-router-dom'
import { IconShieldCheck } from '@tabler/icons-react'
import { POSTING_RULES } from '../../community/standards'

/* Shown once, before a photographer's first upload (V1). This is the
   filter-on-posting leg of App Review guideline 1.2 — the rules are four lines
   so they get read, and agreement is a deliberate tap rather than fine print
   under a button someone was already pressing. */
export default function StandardsGate({
  onClose, onAgree,
}: { onClose: () => void; onAgree: () => void }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Community standards" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden />
        <h2 style={{ fontSize: 19, margin: '4px 0 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconShieldCheck size={20} color="var(--terracotta)" /> Community standards
        </h2>
        <p className="small muted" style={{ margin: '0 0 12px' }}>
          Your shots are visible to every other photographer here. Before your first one:
        </p>
        <div className="card list">
          {POSTING_RULES.map((rule) => (
            <div className="row" key={rule}><span className="rowleft">{rule}</span></div>
          ))}
        </div>
        <p className="small tertiary" style={{ margin: '10px 2px 14px', lineHeight: 1.6 }}>
          Anyone can report a shot, and two independent reports hide it while a curator
          reviews. Full{' '}
          <Link to="/guidelines" style={{ color: 'var(--terracotta)' }}>community guidelines</Link>.
        </p>
        <button className="cta" onClick={onAgree}>I agree</button>
        <button className="chip" onClick={onClose} style={{ width: '100%', marginTop: 8 }}>Not now</button>
      </div>
    </div>
  )
}
