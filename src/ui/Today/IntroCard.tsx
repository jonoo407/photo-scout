import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconX, IconCurrentLocation, IconBuildings, IconSunset2 } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { nearestRegion } from '../../data/regions'

/* One-time welcome for brand-new users: what the app is + get them into the
   right city with their real location. Any action dismisses it for good. */
export default function IntroCard() {
  const nav = useNavigate()
  const introSeen = useStore((s) => s.introSeen)
  const dismissIntro = useStore((s) => s.dismissIntro)
  const setRegion = useStore((s) => s.setRegion)
  const setHome = useStore((s) => s.setHome)
  const [locating, setLocating] = useState(false)

  if (introSeen) return null

  const useLocation = () => {
    if (!navigator.geolocation) { dismissIntro(); nav('/settings'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude: lat, longitude: lng } = p.coords
        setRegion(nearestRegion(lat, lng))
        setHome({ label: 'Current location', lat, lng })
        setLocating(false)
        dismissIntro()
      },
      () => { setLocating(false); dismissIntro(); nav('/settings') },
      { timeout: 8000 },
    )
  }

  return (
    <div className="hero-card" style={{ position: 'relative', marginBottom: 14 }}>
      <button
        aria-label="Dismiss intro"
        onClick={dismissIntro}
        style={{ position: 'absolute', top: 8, right: 8, border: 0, background: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 6 }}
      >
        <IconX size={16} />
      </button>
      <div className="hero-title" style={{ marginTop: 2 }}>
        <IconSunset2 size={20} color="var(--amber)" />
        <span className="t">Welcome to Vantage</span>
      </div>
      <p className="hero-sub" style={{ lineHeight: 1.55 }}>
        Photo spots with the right light — where to stand, when to go, and how to get the shot.
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="chip on" onClick={useLocation}>
          <IconCurrentLocation size={14} /> {locating ? 'Locating…' : 'Use my location'}
        </button>
        <button className="chip" onClick={() => { dismissIntro(); nav('/settings') }}>
          <IconBuildings size={14} /> Pick a city
        </button>
      </div>
    </div>
  )
}
