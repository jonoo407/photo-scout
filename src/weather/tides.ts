/* Tide height via the Open-Meteo Marine API (keyless, CORS-enabled — same infra
   as the weather calls, verified `access-control-allow-origin: *`). NOAA CO-OPS
   is keyless too but does NOT send CORS headers, so it fails in the browser.
   `sea_level_height_msl` is the tidal sea level; low tides are its local minima. */

export interface TideSeries { time: number[]; height: number[] } // time = unixtime seconds (UTC)

export function parseMarineTides(j: unknown): TideSeries {
  const h = ((j ?? {}) as Record<string, any>).hourly ?? {}
  const time = Array.isArray(h.time) ? h.time.map((x: unknown) => Number(x)).filter((n: number) => Number.isFinite(n)) : []
  const height = Array.isArray(h.sea_level_height_msl) ? h.sea_level_height_msl.map((x: unknown) => Number(x)) : []
  return { time, height }
}

/** Minutes from `when` to the nearest low tide (local minimum of sea level), or null. */
export function lowTideMinutesNear(s: TideSeries, when: Date): number | null {
  const { time, height } = s
  if (time.length < 3 || height.length < 3) return null
  const target = when.getTime()
  let best: number | null = null
  for (let i = 1; i < height.length - 1; i++) {
    if (Number.isFinite(height[i]) && height[i] < height[i - 1] && height[i] <= height[i + 1]) {
      const dm = Math.abs(time[i] * 1000 - target) / 60000
      if (best == null || dm < best) best = dm
    }
  }
  return best == null ? null : Math.round(best)
}

export async function fetchMarineTides(lat: number, lng: number, fetchImpl: typeof fetch = fetch): Promise<TideSeries> {
  const url =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
    `&hourly=sea_level_height_msl&timeformat=unixtime&timezone=auto&forecast_days=16`
  try {
    const res = await fetchImpl(url)
    if (!res.ok) return { time: [], height: [] }
    return parseMarineTides(await res.json())
  } catch {
    return { time: [], height: [] }
  }
}
