import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SPOTS } from '../../data/spots'
import { CATEGORIES, CATEGORY_COLOR, CATEGORY_LABEL } from '../../spots/types'
import { useStore } from '../../state/store'

export default function MapScreen() {
  const nav = useNavigate()
  const home = useStore((s) => s.home)
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const map = L.map(ref.current, { zoomControl: true, attributionControl: true })
    mapRef.current = map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map)

    const pts: L.LatLngExpression[] = []
    for (const spot of SPOTS) {
      pts.push([spot.lat, spot.lng])
      const m = L.circleMarker([spot.lat, spot.lng], {
        radius: 7, color: '#fff', weight: 1.5, fillColor: CATEGORY_COLOR[spot.category], fillOpacity: 1,
      }).addTo(map)
      m.bindTooltip(spot.name, { direction: 'top' })
      m.on('click', () => nav(`/spot/${spot.id}`))
    }
    L.marker([home.lat, home.lng], {
      icon: L.divIcon({
        className: '', html: '<div style="background:#2e2014;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff">⌂</div>',
        iconSize: [22, 22], iconAnchor: [11, 11],
      }),
    }).addTo(map).bindTooltip('Home', { direction: 'top' })
    pts.push([home.lat, home.lng])

    map.fitBounds(L.latLngBounds(pts).pad(0.12))

    return () => { map.remove(); mapRef.current = null }
  }, [home.lat, home.lng, nav])

  return (
    <div className="screen">
      <h1>Map</h1>
      <div id="map" ref={ref} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', marginTop: 10, fontSize: 12, color: 'var(--ink-2)' }}>
        {CATEGORIES.map((c) => (
          <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: CATEGORY_COLOR[c], display: 'inline-block' }} />
            {CATEGORY_LABEL[c]}
          </span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>⌂ Home</span>
      </div>
    </div>
  )
}
