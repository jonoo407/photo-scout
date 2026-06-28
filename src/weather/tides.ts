/* Keyless tide predictions via NOAA CO-OPS (tidesandcurrents.gov). hi/lo only.
   Times come back in the station's local time (lst_ldt) — fine for local users. */

export interface TidePoint { t: Date; type: 'L' | 'H'; height: number }

export function parseTidePredictions(j: unknown): TidePoint[] {
  const rows = (j as { predictions?: unknown[] })?.predictions
  if (!Array.isArray(rows)) return []
  return rows
    .map((r) => {
      const row = r as { t?: string; type?: string; v?: string }
      const t = new Date(String(row.t).replace(' ', 'T'))
      return { t, type: row.type === 'L' ? ('L' as const) : ('H' as const), height: Number(row.v) }
    })
    .filter((p) => !Number.isNaN(p.t.getTime()))
}

/** Minutes from `when` to the nearest LOW tide, or null if there are none. */
export function lowTideMinutesNear(preds: TidePoint[], when: Date): number | null {
  const lows = preds.filter((p) => p.type === 'L')
  if (!lows.length) return null
  let best = Infinity
  for (const l of lows) best = Math.min(best, Math.abs(l.t.getTime() - when.getTime()) / 60000)
  return Math.round(best)
}

export async function fetchTides(
  stationId: string, beginYYYYMMDD: string, endYYYYMMDD: string, fetchImpl: typeof fetch = fetch,
): Promise<TidePoint[]> {
  const url =
    `https://api.tidesandcurrents.gov/api/prod/datagetter?product=predictions&datum=MLLW` +
    `&interval=hilo&units=english&time_zone=lst_ldt&format=json` +
    `&station=${encodeURIComponent(stationId)}&begin_date=${beginYYYYMMDD}&end_date=${endYYYYMMDD}`
  try {
    const res = await fetchImpl(url)
    if (!res.ok) return []
    return parseTidePredictions(await res.json())
  } catch {
    return []
  }
}
