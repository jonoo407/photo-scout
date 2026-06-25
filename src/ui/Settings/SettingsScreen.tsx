import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconHome, IconBuildingCommunity, IconNavigation, IconRuler2,
  IconBellRinging, IconCameraPlus, IconCurrentLocation, IconChevronRight, IconMapPin,
} from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { geocodeAddress } from '../../spots/geocode'

export default function SettingsScreen() {
  const nav = useNavigate()
  const home = useStore((s) => s.home)
  const setHome = useStore((s) => s.setHome)
  const units = useStore((s) => s.units)
  const setUnits = useStore((s) => s.setUnits)
  const mapsApp = useStore((s) => s.mapsApp)
  const setMapsApp = useStore((s) => s.setMapsApp)
  const [locating, setLocating] = useState(false)
  const [addr, setAddr] = useState('')
  const [geoBusy, setGeoBusy] = useState(false)
  const [geoErr, setGeoErr] = useState('')

  const useCurrent = () => {
    if (!navigator.geolocation) {
      setGeoErr('Location unavailable on this device — type an address instead.')
      return
    }
    setGeoErr(''); setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => { setHome({ label: 'Current location', lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false) },
      () => { setGeoErr("Couldn't get your location — check permissions, or type an address instead."); setLocating(false) },
      { timeout: 8000 },
    )
  }

  const submitAddress = async () => {
    if (!addr.trim() || geoBusy) return
    setGeoErr(''); setGeoBusy(true)
    const result = await geocodeAddress(addr)
    setGeoBusy(false)
    if (result) { setHome(result); setAddr('') }
    else setGeoErr("Couldn't find that address — try adding the city, e.g. “123 Main St, Tampa”.")
  }

  return (
    <div className="screen">
      <button className="back" onClick={() => nav(-1)}><IconArrowLeft size={18} /> Back</button>
      <h1>Settings</h1>

      <p className="shdr">HOME &amp; LOCATION</p>
      <div className="card list">
        <div className="row"><span className="rowleft"><IconHome size={18} /> Home base</span><span className="val">{home.label}</span></div>
        <div className="row">
          <span className="rowleft"><IconMapPin size={18} /> Set by address</span>
          <span className="addrset">
            <input
              className="addrinput"
              type="text"
              inputMode="text"
              placeholder="Enter an address"
              value={addr}
              onChange={(e) => { setAddr(e.target.value); if (geoErr) setGeoErr('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') submitAddress() }}
              aria-label="Home address"
            />
            <button className="chip on" onClick={submitAddress} disabled={geoBusy || !addr.trim()}>
              {geoBusy ? '…' : 'Set'}
            </button>
          </span>
        </div>
        {geoErr && <p className="small" style={{ color: 'var(--skip-ink)', margin: '0 2px 8px' }}>{geoErr}</p>}
        <button className="row" onClick={useCurrent}>
          <span className="rowleft" style={{ color: 'var(--terracotta)' }}><IconCurrentLocation size={18} /> {locating ? 'Locating…' : 'Use my current location'}</span>
          <IconChevronRight size={16} className="val" />
        </button>
        <div className="row last"><span className="rowleft"><IconBuildingCommunity size={18} /> City</span><span className="val">Tampa Bay</span></div>
      </div>

      <p className="shdr">GETTING THERE</p>
      <div className="card list">
        <div className="row">
          <span className="rowleft"><IconNavigation size={18} /> Maps app</span>
          <span style={{ display: 'flex', gap: 4 }}>
            <button className={`chip ${mapsApp === 'apple' ? 'on' : ''}`} onClick={() => setMapsApp('apple')}>Apple</button>
            <button className={`chip ${mapsApp === 'google' ? 'on' : ''}`} onClick={() => setMapsApp('google')}>Google</button>
          </span>
        </div>
        <div className="row last">
          <span className="rowleft"><IconRuler2 size={18} /> Units</span>
          <span style={{ display: 'flex', gap: 4 }}>
            <button className={`chip ${units === 'imperial' ? 'on' : ''}`} onClick={() => setUnits('imperial')}>°F · mi</button>
            <button className={`chip ${units === 'metric' ? 'on' : ''}`} onClick={() => setUnits('metric')}>°C · km</button>
          </span>
        </div>
      </div>

      <p className="shdr">MORE</p>
      <div className="card list">
        <div className="row"><span className="rowleft tertiary"><IconBellRinging size={18} /> Conditions alerts</span><span className="pill info">v2</span></div>
        <div className="row last"><span className="rowleft tertiary"><IconCameraPlus size={18} /> Add your own photos</span><span className="pill info">soon</span></div>
      </div>

      <p className="small tertiary" style={{ margin: '14px 2px 0', lineHeight: 1.6 }}>
        Hours, fees and closures are spot-checked but can change — confirm before a special trip.
      </p>
    </div>
  )
}
