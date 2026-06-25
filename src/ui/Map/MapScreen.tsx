import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SPOTS } from '../../data/spots'
import { CATEGORIES, CATEGORY_COLOR, CATEGORY_LABEL, type Category } from '../../spots/types'
import { useStore } from '../../state/store'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

export default function MapScreen() {
  const home = useStore((s) => s.home)
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const [shown, setShown] = useState<Set<Category>>(() => new Set(CATEGORIES))

  // Create the map once.
  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const map = L.map(ref.current, { zoomControl: true, attributionControl: true })
    mapRef.current = map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    map.setView([home.lat, home.lng], 10)
    return () => { map.remove(); mapRef.current = null; layerRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // (Re)draw markers when the category filter or home changes.
  useEffect(() => {
    const map = mapRef.current, layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    const pts: L.LatLngExpression[] = [[home.lat, home.lng]]

    L.marker([home.lat, home.lng], {
      icon: L.divIcon({
        className: '',
        html: '<div style="background:#2e2014;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff">⌂</div>',
        iconSize: [22, 22], iconAnchor: [11, 11],
      }),
    }).addTo(layer).bindTooltip('Home', { direction: 'top' })

    for (const spot of SPOTS) {
      if (!shown.has(spot.category)) continue
      pts.push([spot.lat, spot.lng])
      L.circleMarker([spot.lat, spot.lng], {
        radius: 7, color: '#fff', weight: 1.5, fillColor: CATEGORY_COLOR[spot.category], fillOpacity: 1,
      })
        .addTo(layer)
        .bindTooltip(spot.name, { direction: 'top' })
        .bindPopup(`<strong>${esc(spot.name)}</strong><br><a href="#/spot/${spot.id}" style="color:#c45a2c">View spot →</a>`)
    }

    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts).pad(0.12))
  }, [shown, home.lat, home.lng])

  const toggle = (c: Category) => setShown((prev) => {
    const next = new Set(prev)
    next.has(c) ? next.delete(c) : next.add(c)
    return next
  })

  return (
    <div className="screen">
      <h1>Map</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip ${shown.has(c) ? 'on' : ''}`} onClick={() => toggle(c)}>
            <span style={{ width: 9, height: 9, borderRadius: 5, background: CATEGORY_COLOR[c], display: 'inline-block' }} />
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>
      <div id="map" ref={ref} role="application" aria-label="Map of Tampa Bay photo spots" />
      <p className="small tertiary" style={{ marginTop: 8 }}>Tap a pin for a preview · ⌂ is your home base</p>
    </div>
  )
}
