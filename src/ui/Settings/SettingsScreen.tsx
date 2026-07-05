import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconHome, IconNavigation, IconRuler2,
  IconCameraPlus, IconCurrentLocation, IconChevronRight, IconMapPin, IconMoonStars,
} from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { REGION_LIST, nearestRegion } from '../../data/regions'
import { geocodeAddress } from '../../spots/geocode'
import AccountSection from './AccountSection'
import AlertsSection from './AlertsSection'

export default function SettingsScreen() {
  const nav = useNavigate()
  const home = useStore((s) => s.home)
  const setHome = useStore((s) => s.setHome)
  const units = useStore((s) => s.units)
  const setUnits = useStore((s) => s.setUnits)
  const mapsApp = useStore((s) => s.mapsApp)
  const setMapsApp = useStore((s) => s.setMapsApp)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const region = useStore((s) => s.region)
  const setRegion = useStore((s) => s.setRegion)
  const [locating, setLocating] = useState(false)
  const [addr, setAddr] = useState('')
  const [geoBusy, setGeoBusy] = useState(false)
  const [geoErr, setGeoErr] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [detecting, setDetecting] = useState(false)

  const detectCity = () => {
    if (!navigator.geolocation) { setGeoErr('Location unavailable — pick a city below.'); return }
    setGeoErr(''); setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude, lng = p.coords.longitude
        // Pick the nearest city AND pin home to where the user actually is, so
        // drive times/distances are from their location — not the city default.
        setRegion(nearestRegion(lat, lng))
        setHome({ label: 'Current location', lat, lng })
        setDetecting(false)
      },
      () => { setGeoErr("Couldn't get your location — pick a city below."); setDetecting(false) },
      { timeout: 8000 },
    )
  }

  const manyCities = REGION_LIST.length > 8
  const cityList = manyCities
    ? REGION_LIST.filter((r) => r.label.toLowerCase().includes(citySearch.trim().toLowerCase()))
    : REGION_LIST

  const useCurrent = () => {
    if (!navigator.geolocation) {
      setGeoErr('Location unavailable on this device — type an address instead.')
      return
    }
    setGeoErr(''); setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude, lng = p.coords.longitude
        setRegion(nearestRegion(lat, lng)) // keep the active city in sync with home
        setHome({ label: 'Current location', lat, lng })
        setLocating(false)
      },
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

      <AccountSection />

      <p className="shdr">CITY</p>
      <div className="card list">
        <button className="row" onClick={detectCity}>
          <span className="rowleft" style={{ color: 'var(--terracotta)' }}><IconCurrentLocation size={18} /> {detecting ? 'Detecting…' : 'Use my location'}</span>
          <IconChevronRight size={16} className="val" />
        </button>
        {manyCities && (
          <div className="row">
            <input
              className="addrinput" style={{ width: '100%', maxWidth: 'none' }} type="text"
              placeholder="Search cities" aria-label="Search cities"
              value={citySearch} onChange={(e) => setCitySearch(e.target.value)}
            />
          </div>
        )}
        <div className="row last" style={{ flexWrap: 'wrap', gap: 6, justifyContent: 'flex-start' }}>
          {cityList.map((r) => (
            <button key={r.id} className={`chip ${region === r.id ? 'on' : ''}`} onClick={() => setRegion(r.id)}>{r.label}</button>
          ))}
          {!cityList.length && <span className="small tertiary">No matching city</span>}
        </div>
      </div>

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

      <p className="shdr">APPEARANCE</p>
      <div className="card list">
        <div className="row last">
          <span className="rowleft"><IconMoonStars size={18} /> Theme</span>
          <span style={{ display: 'flex', gap: 4 }}>
            {(['auto', 'light', 'dark'] as const).map((t) => (
              <button key={t} className={`chip ${theme === t ? 'on' : ''}`} onClick={() => setTheme(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
            ))}
          </span>
        </div>
      </div>

      <p className="shdr">MORE</p>
      <div className="card list">
        <AlertsSection />
        <div className="row last"><span className="rowleft tertiary"><IconCameraPlus size={18} /> Add your own photos</span><span className="pill info">soon</span></div>
      </div>

      <p className="small tertiary" style={{ margin: '14px 2px 0', lineHeight: 1.6 }}>
        Hours, fees and closures are spot-checked but can change — confirm before a special trip.
      </p>
    </div>
  )
}
