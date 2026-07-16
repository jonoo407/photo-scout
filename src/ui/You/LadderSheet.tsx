import { IconCheck } from '@tabler/icons-react'
import { TIERS, tierProgress } from '../../craft/tiers'
import { POINT_VALUES } from '../../craft/points'
import { Medallion } from './Medallion'

const fmt = (n: number) => n.toLocaleString('en-US')

/* The craft ladder bottom sheet (handoff 2b): where you sit, every tier's
   threshold + perk, and how points land. */
export default function LadderSheet({ points, onClose }: { points: number; onClose: () => void }) {
  const { tier, next, ptsToNext, fraction } = tierProgress(points)
  const ci = TIERS.indexOf(tier)

  const rowStatus = (i: number) => {
    if (i < ci) return <IconCheck size={13} color="var(--go-ink)" aria-label="Reached" />
    if (i === ci) return <span style={{ color: 'var(--maybe-ink)', fontWeight: 500 }}>now</span>
    if (i === ci + 1) return <span>{fmt(TIERS[i].threshold - points)} to go</span>
    return <span className="tertiary">locked</span>
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Craft ladder" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden />
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ display: 'inline-flex' }}><Medallion tier={tier} size={84} /></div>
          <h2 style={{ fontSize: 22, margin: '12px 0 4px' }}>{tier.name}</h2>
          <p className="small muted" style={{ margin: 0 }}>
            {fmt(points)} pts{next ? ` · ${fmt(ptsToNext)} to ${next.name}` : ' · Top of the ladder'}
          </p>
          <span className="progressbar" style={{ display: 'block', margin: '10px auto 0', maxWidth: 220 }}>
            <span className="progressfill" style={{ width: `${Math.round(fraction * 100)}%`, background: 'var(--amber)' }} />
          </span>
        </div>

        <div className="card list">
          {TIERS.map((t, i) => (
            <div key={t.id} className={`row ${i === ci ? 'tier-now' : ''}`} style={i < ci ? { opacity: 0.6 } : undefined}>
              <span className="rowleft">
                <Medallion tier={t} size={40} />
                <span>
                  {i === ci ? <strong style={{ fontWeight: 500 }}>{t.name} — you</strong> : t.name}
                  <span className="small tertiary" style={{ display: 'block' }}>
                    {t.threshold === 0 ? 'Join Vantage · perks: —' : `${fmt(t.threshold)} pts · perk: ${t.perk}`}
                  </span>
                </span>
              </span>
              <span className="val small nowrap">{rowStatus(i)}</span>
            </div>
          ))}
        </div>

        <p className="shdr">HOW POINTS LAND</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="fact good">Been there, shot verified +{POINT_VALUES.shotVerified}</span>
          <span className="fact">Hunt stop +{POINT_VALUES.huntStop}</span>
          <span className="fact">Hunt finished +{POINT_VALUES.huntFinish}</span>
          <span className="fact">Shot rated 4★+ by peers +{POINT_VALUES.topShot}</span>
          <span className="fact">Critique given +{POINT_VALUES.critiqueGiven}</span>
          <span className="fact good">Friend joins via your invite +{POINT_VALUES.referral}</span>
        </div>
      </div>
    </div>
  )
}
