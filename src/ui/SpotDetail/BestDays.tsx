import { useEffect, useMemo, useState } from 'react'
import type { Spot } from '../../spots/types'
import { rankBestDays, windowTimeFor } from '../../spots/best-days'
import { fetchSkyForecast, skyScoreAt, type SkyHourly } from '../../weather/open-meteo'
import { fetchMarineTides, lowTideMinutesNear, type TideSeries } from '../../weather/tides'
import { getRegion } from '../../data/regions'
import { fmtDay } from '../../util/format'

const chipKind = (score: number) => (score >= 75 ? 'go' : score >= 55 ? 'maybe' : 'info')

export default function BestDays({ spot }: { spot: Spot }) {
  const tz = getRegion(spot.region).timeZone
  const [sky, setSky] = useState<SkyHourly | null>(null)
  const [tides, setTides] = useState<TideSeries | null>(null)

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
      <h3 className="h3">Best days this month</h3>
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
    </>
  )
}
