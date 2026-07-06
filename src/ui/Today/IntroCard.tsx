import { useState } from 'react'
import { IconX, IconCurrentLocation, IconSunset2, IconStar, IconSun } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { nearestRegion, REGION_LIST } from '../../data/regions'
import { useRegionSpots } from '../../state/useRegion'
import { introPicks } from '../../spots/intro-picks'
import { SpotCard } from '../SpotCard'

/* First-run onboarding, three quick steps in one card:
   1. pick your city (or locate), 2. seed a few want-to-gos from real spots,
   3. the promise — what Today does for you now. Dismissible at any step. */
export default function IntroCard() {
  const introSeen = useStore((s) => s.introSeen)
  const dismissIntro = useStore((s) => s.dismissIntro)
  const setRegion = useStore((s) => s.setRegion)
  const setHome = useStore((s) => s.setHome)
  const wishlist = useStore((s) => s.wishlist)
  const toggleWishlist = useStore((s) => s.toggleWishlist)
  const { spots } = useRegionSpots()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [locating, setLocating] = useState(false)

  if (introSeen) return null

  const useLocation = () => {
    if (!navigator.geolocation) { setStep(2); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude: lat, longitude: lng } = p.coords
        setRegion(nearestRegion(lat, lng))
        setHome({ label: 'Current location', lat, lng })
        setLocating(false)
        setStep(2)
      },
      () => { setLocating(false); setStep(2) },
      { timeout: 8000 },
    )
  }

  const picks = step === 2 ? introPicks(spots, 5) : []

  return (
    <div className="hero-card" style={{ position: 'relative', marginBottom: 14 }}>
      <button
        aria-label="Dismiss intro"
        onClick={dismissIntro}
        style={{ position: 'absolute', top: 8, right: 8, border: 0, background: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 6, zIndex: 1 }}
      >
        <IconX size={16} />
      </button>

      {step === 1 && (
        <>
          <div className="hero-title" style={{ marginTop: 2 }}>
            <IconSunset2 size={20} color="var(--amber)" />
            <span className="t">Welcome to Vantage</span>
          </div>
          <p className="hero-sub" style={{ lineHeight: 1.55 }}>
            Photo spots with the right light — where to stand, when to go, and how to get the shot.
            First: where do you shoot?
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button className="chip on" onClick={useLocation}>
              <IconCurrentLocation size={14} /> {locating ? 'Locating…' : 'Use my location'}
            </button>
            {REGION_LIST.map((r) => (
              <button key={r.id} className="chip" onClick={() => { setRegion(r.id); setStep(2) }}>
                {r.label}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="hero-title" style={{ marginTop: 2 }}>
            <IconStar size={20} color="var(--maybe-ink)" />
            <span className="t">Tap what you'd love to shoot</span>
          </div>
          <p className="hero-sub" style={{ lineHeight: 1.55 }}>
            They land on your Saved list — and power your recommendations.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '10px 0' }}>
            {picks.map((s) => (
              <SpotCard
                key={s.id}
                spot={s}
                onPress={() => toggleWishlist(s.id)}
                badge={wishlist.includes(s.id) ? { label: 'Added', kind: 'go' } : { label: 'Add', kind: 'info' }}
              />
            ))}
          </div>
          <button className="chip on" onClick={() => setStep(3)}>Continue</button>
        </>
      )}

      {step === 3 && (
        <>
          <div className="hero-title" style={{ marginTop: 2 }}>
            <IconSun size={20} color="var(--amber)" />
            <span className="t">You're set</span>
          </div>
          <p className="hero-sub" style={{ lineHeight: 1.6 }}>
            <strong>Next Up</strong> below picks the best spot for the light and weather
            right now — check it whenever you can slip out. Want the app to call
            you instead? Turn on <strong>Conditions alerts</strong> in Settings and
            it pushes you when a saved spot's evening lines up.
          </p>
          <button className="chip on" style={{ marginTop: 10 }} onClick={dismissIntro}>
            <IconSunset2 size={14} /> Start shooting
          </button>
        </>
      )}
    </div>
  )
}
