import { useEffect, useMemo, useState } from 'react'
import { IconInfoCircle } from '@tabler/icons-react'
import type { Spot } from '../../spots/types'
import { rankBestDays, windowTimeFor } from '../../spots/best-days'
import { SCORE_EXPLAINER, SCORE_FACTORS } from '../../spots/score-explainer'
import { fetchSkyForecast, skyScoreAt, type SkyHourly } from '../../weather/open-meteo'
import { fetchMarineTides, lowTideMinutesNear, type TideSeries } from '../../weather/tides'
import { getRegion } from '../../data/regions'
import { fmtDay } from '../../util/format'

const chipKind = (score: number) => (score >= 75 ? 'go' : score >= 55 ? 'maybe' : 'info')

export default function BestDays({ spot }: { spot: Spot }) {
  const tz = getRegion(spot.region).timeZone
  const [sky, setSky] = useState<SkyHourly | null>(null)
  const [tides, setTides] = useState<TideSeries | null>(null)
  const [explain, setExplain] = useState(false)

  useEffect(() => {
    let alive = true
    fetchSkyForecast(spot.lat, spot.lng).then((s) => { if (alive) setSky(s) }).catch(() => {})
    if (spot.tideStationId) {
      fetchMarineTides(spot.lat, spot.lng).then((t) => { if (alive) setTides(t) }).catch(() => {})
    }
    return () => { alive = false }
  }, [spot.lat, spot.lng, spot.tideStationId])

  const days = useMemo(() => {
    const now = new Date()
    const dates = Array.from({ length: 30 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + i))
    return rankBestDays(spot, dates, spot.lat, spot.lng, (d) => {
      const wt = windowTimeFor(spot, d, spot.lat, spot.lng)
      return {
        skyScore: sky ? skyScoreAt(sky, wt) : null,
        lowTideMin: tides ? lowTideMinutesNear(tides, wt) : null,
      }
    }).filter((d) => d.open).slice(0, 5)
  }, [spot, sky, tides])

  if (!days.length) return null

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="h3">Best days this month</h3>
        {/* A confident 0–100 with no visible provenance invites "says who?" —
            the ⓘ answers it at a glance without turning the list into a lecture. */}
        <button
          type="button"
          aria-label={SCORE_EXPLAINER.title}
          onClick={() => setExplain(true)}
          className="tertiary"
          style={{ appearance: 'none', border: 0, background: 'none', cursor: 'pointer', padding: '8px 2px 8px 8px', margin: '8px 0 0', display: 'inline-flex', color: 'inherit' }}
        >
          <IconInfoCircle size={18} />
        </button>
      </div>
      <div className="card list">
        {days.map((d) => (
          <div key={d.date.toISOString()} className="row" style={{ alignItems: 'center' }}>
            <span className="rowleft" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, minWidth: 0 }}>
              <span style={{ fontWeight: 500 }}>{fmtDay(d.date, tz)}</span>
              <span className="small tertiary">
                {d.reasons.length ? d.reasons.join(' · ') : 'Open · workable light'}{!d.forecast ? ' · no forecast yet' : ''}
              </span>
            </span>
            <span className={`pill ${chipKind(d.score)}`}>{d.score}</span>
          </div>
        ))}
      </div>
      <p className="small tertiary" style={{ margin: '6px 2px 0', lineHeight: 1.5 }}>
        Scored on sun alignment, moon{tides && tides.time.length ? ', tide' : ''} &amp; access; the next ~16 days also factor the weather forecast.
      </p>

      {explain && (
        <div className="sheet-backdrop" onClick={() => setExplain(false)}>
          <div
            className="sheet"
            role="dialog"
            aria-label={SCORE_EXPLAINER.title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" aria-hidden />
            <h4>{SCORE_EXPLAINER.title}</h4>
            <p className="small muted" style={{ margin: '6px 0 12px', lineHeight: 1.5 }}>{SCORE_EXPLAINER.intro}</p>
            <div style={{ display: 'grid', gap: 9, margin: '0 2px' }}>
              {SCORE_FACTORS.map((f) => (
                <p key={f.title} className="small" style={{ margin: 0, lineHeight: 1.45 }}>
                  <strong style={{ fontWeight: 500 }}>{f.title}</strong>
                  <span className="tertiary"> — {f.detail}</span>
                </p>
              ))}
            </div>
            <p className="small tertiary" style={{ margin: '12px 2px 14px', lineHeight: 1.5 }}>{SCORE_EXPLAINER.threshold}</p>
            <button type="button" className="chip on" style={{ width: '100%' }} onClick={() => setExplain(false)}>Done</button>
          </div>
        </div>
      )}
    </>
  )
}
