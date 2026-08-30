import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { IconCar } from '@tabler/icons-react'
import { CATEGORY_LABEL, type Spot } from '../../spots/types'
import { useStore } from '../../state/store'
import { useRegion } from '../../state/useRegion'
import { pinSpecs, sunLineSpecs, viewForPins, keepSelection, HOME_TOOLTIP } from './map-model'
import { driveMinutes } from '../../spots/live'
import { fmtDrive } from '../../util/format'
import { SpotCard } from '../SpotCard'

/* Explore's spatial lens (IA redesign 1f). Everything the old Map tab had —
   category-colored pins, home marker, tap-for-sun-lines — plus: selecting a
   pin surfaces the same SpotCard the list uses, floating over the map. Pins
   come pre-filtered by Explore, so both lenses always agree. */
export default function MapView({ spots }: { spots: Spot[] }) {
  const home = useStore((s) => s.home)
  const region = useRegion()
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const sunLayerRef = useRef<L.LayerGroup | null>(null)
  const [selected, setSelected] = useState<Spot | null>(null)

  // Create the map once.
  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const map = L.map(ref.current, { zoomControl: true, attributionControl: true })
    mapRef.current = map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    sunLayerRef.current = L.layerGroup().addTo(map)
    map.setView([home.lat, home.lng], 10)
    // Tapping bare map dismisses the floating card + sun lines.
    map.on('click', () => { setSelected(null); sunLayerRef.current?.clearLayers() })
    return () => { map.remove(); mapRef.current = null; layerRef.current = null; sunLayerRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // PhotoPills-style sun lines: where the sun rises and sets from a spot today.
  // The geometry lives in map-model.ts so it can be tested without a browser.
  const drawSunLines = (lat: number, lng: number) => {
    const layer = sunLayerRef.current
    if (!layer) return
    layer.clearLayers()
    for (const line of sunLineSpecs(lat, lng, new Date())) {
      L.polyline([line.from, line.to], {
        color: line.color, weight: 3, opacity: 0.9, dashArray: '2 7', lineCap: 'round',
      })
        .addTo(layer)
        .bindTooltip(line.label, { direction: 'top' })
    }
  }

  // (Re)draw markers when the filtered set or home changes.
  useEffect(() => {
    const map = mapRef.current, layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()

    L.marker([home.lat, home.lng], {
      icon: L.divIcon({
        className: '',
        html: '<div style="background:#2e2014;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff">⌂</div>',
        iconSize: [22, 22], iconAnchor: [11, 11],
      }),
    }).addTo(layer).bindTooltip(HOME_TOOLTIP, { direction: 'top' })

    const specs = pinSpecs(spots)
    specs.forEach((pin, i) => {
      L.circleMarker([pin.lat, pin.lng], pin.style)
        .addTo(layer)
        .bindTooltip(pin.tooltip, { direction: 'top' })
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e)
          setSelected(spots[i])
          drawSunLines(pin.lat, pin.lng)
        })
    })

    const view = viewForPins(spots, home)
    if (view.kind === 'bounds') map.fitBounds(L.latLngBounds(view.bounds).pad(view.pad))
    else map.setView(view.center, view.zoom) // empty set → center on home
  }, [spots, home.lat, home.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  // A filter change can remove the selected spot — drop the card with it.
  useEffect(() => {
    if (selected && !keepSelection(selected, spots)) setSelected(null)
  }, [spots, selected])

  return (
    <div style={{ position: 'relative' }}>
      <div id="map" ref={ref} role="application" aria-label={`Map of ${region.label} photo spots`} />
      <p className="small tertiary" style={{ marginTop: 8 }}>
        Tap a pin for today's sun lines —{' '}
        <span style={{ color: 'var(--gold)' }}>sunrise</span> ·{' '}
        <span style={{ color: 'var(--terracotta)' }}>sunset</span> · ⌂ is home
      </p>
      {selected && (
        <div style={{ position: 'absolute', left: 8, right: 8, bottom: 44, zIndex: 800, filter: 'drop-shadow(0 8px 20px rgba(46, 32, 20, 0.22))' }}>
          <SpotCard
            spot={selected}
            reason={`${CATEGORY_LABEL[selected.category]} · ${selected.isFree ? 'Free' : `$${selected.feeUSD}`} · ${selected.city}`}
            meta={<span><IconCar size={14} /> {fmtDrive(driveMinutes(selected, home))}</span>}
          />
        </div>
      )}
    </div>
  )
}
