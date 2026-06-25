import type { HomeLocation } from '../data/home.config'

/* Keyless street-address geocoding via OpenStreetMap Nominatim (no API key,
   CORS-enabled). Used only on an explicit "Set" tap in Settings — never as
   per-keystroke autocomplete — to stay within Nominatim's usage policy. */

export type GeocodeResult = Required<Pick<HomeLocation, 'label' | 'address' | 'lat' | 'lng'>>

export async function geocodeAddress(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GeocodeResult | null> {
  const q = query.trim()
  if (!q) return null
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
  let data: unknown
  try {
    const res = await fetchImpl(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    data = await res.json()
  } catch {
    return null
  }
  if (!Array.isArray(data) || data.length === 0) return null
  const top = data[0] as { lat?: string; lon?: string }
  const lat = Number(top.lat)
  const lng = Number(top.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { label: q, address: q, lat, lng }
}
