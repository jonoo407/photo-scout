import { useEffect, useState } from 'react'
import { IconBellRinging } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { requireSignIn } from '../../auth/sign-in-prompt'
import {
  alertsSupported, alertsAreOn, enableAlerts, disableAlerts, type EnableAlertsFailure,
} from '../../push/alerts'
import { ALERT_SCORE } from '../../push/alert-rules'

/* Conditions alerts: the app pings YOU when a watched (want-to-go) spot's
   evening lines up — sky score, sun alignment, moon. The engine runs in the
   Worker cron; this is just the opt-in switch. */
export default function AlertsSection() {
  const wishlist = useStore((s) => s.wishlist)
  const supported = alertsSupported()
  const [on, setOn] = useState<boolean | null>(null) // null = still checking
  const [busy, setBusy] = useState(false)
  const [fail, setFail] = useState<EnableAlertsFailure | null>(null)

  useEffect(() => {
    if (!supported) { setOn(false); return }
    let alive = true
    alertsAreOn().then((v) => { if (alive) setOn(v) }).catch(() => { if (alive) setOn(false) })
    return () => { alive = false }
  }, [supported])

  const toggle = async () => {
    if (busy || on == null) return
    if (!on && !requireSignIn('alerts')) return
    setBusy(true)
    setFail(null)
    try {
      if (on) {
        await disableAlerts()
        setOn(false)
      } else {
        const r = await enableAlerts(wishlist)
        setOn(r.on)
        setFail(r.failure)
      }
    } catch {
      setFail('network')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="row">
      <span className="rowleft" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
        <span className="rowleft"><IconBellRinging size={18} /> Conditions alerts</span>
        <span className="small tertiary">
          {supported
            ? `Pushes you when a Want-to-go spot's light lines up (score ${ALERT_SCORE}+)`
            : 'Pushes you when a saved spot lines up'}
        </span>
        {fail === 'blocked' && <span className="small" style={{ color: 'var(--skip-ink)' }}>Notifications are blocked — allow them for Vantage in your device or browser settings, then try again.</span>}
        {fail === 'registration' && <span className="small" style={{ color: 'var(--skip-ink)' }}>Apple didn&rsquo;t register this device for notifications — check your connection and try again in a moment.</span>}
        {fail === 'network' && <span className="small" style={{ color: 'var(--skip-ink)' }}>Couldn&rsquo;t reach the alert server — check your connection and try again.</span>}
      </span>
      {supported ? (
        <button className={`chip ${on ? 'on' : ''}`} disabled={busy || on == null} onClick={() => void toggle()}>
          {on == null ? '…' : busy ? (on ? 'Turning off…' : 'Turning on…') : on ? 'Turn off' : 'Turn on'}
        </button>
      ) : (
        <span className="pill info">not supported here</span>
      )}
    </div>
  )
}
