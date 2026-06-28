import { useEffect, useMemo, useState } from 'react'
import type { Spot } from '../../spots/types'
import { rankBestDays, windowTimeFor } from '../../spots/best-days'
import { fetchSkyForecast, skyScoreAt, type SkyHourly } from '../../weather/open-meteo'
import { fetchTides, lowTideMinutesNear, type TidePoint } from '../../weather/tides'

const ymd = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
const chipKind = (score: number) => (score >= 75 ? 'go' : score >= 55 ? 'maybe' : 'info')

export default function BestDays({ spot }: { spot: Spot }) {
  const [sky, setSky] = useState<SkyHourly | null>(null)
  const [tides, setTides] = useState<TidePoint[] | null>(null)

  useEffect(() => {
    let alive = true
    fetchSkyForecast(spot.lat, spot.lng).then((s) => { if (alive) setSky(s) }).catch(() => {})
    if (spot.tideStationId) {
      const now = new Date()
      fetchTides(spot.tideStationId, ymd(now), ymd(new Date(now.getTime() + 31 * 86400000)))
        .then((t) => { if (alive) setTides(t) }).catch(() => {})
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
      <h3 className="h3">Best days this month</h3>
      <div className="card list">
        {days.map((d) => (
          <div key={d.date.toISOString()} className="row" style={{ alignItems: 'center' }}>
            <span className="rowleft" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, minWidth: 0 }}>
              <span style={{ fontWeight: 500 }}>{fmtDay(d.date)}</span>
              <span className="small tertiary">
                {d.reasons.length ? d.reasons.join(' · ') : 'Open · workable light'}{!d.forecast ? ' · no forecast yet' : ''}
              </span>
            </span>
            <span className={`pill ${chipKind(d.score)}`}>{d.score}</span>
          </div>
        ))}
      </div>
      <p className="small tertiary" style={{ margin: '6px 2px 0', lineHeight: 1.5 }}>
        Scored on sun alignment, moon{tides && tides.length ? ', tide' : ''} &amp; access; the next ~16 days also factor the weather forecast.
      </p>
    </>
  )
}
