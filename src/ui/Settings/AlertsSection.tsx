import { useEffect, useState } from 'react'
import { IconBellRinging } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { useAuth } from '../../auth/useAuth'
import { pushSupported, alertsEnabled, enableConditionAlerts, disableConditionAlerts } from '../../push/client'
import { ALERT_SCORE } from '../../push/alert-rules'

/* Conditions alerts: the app pings YOU when a watched (want-to-go) spot's
   evening lines up — sky score, sun alignment, moon. The engine runs in the
   Worker cron; this is just the opt-in switch. */
export default function AlertsSection() {
  const wishlist = useStore((s) => s.wishlist)
  const user = useAuth((s) => s.user)
  const supported = pushSupported()
  const [on, setOn] = useState<boolean | null>(null) // null = still checking
  const [busy, setBusy] = useState(false)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    if (!supported) { setOn(false); return }
    let alive = true
    alertsEnabled().then((v) => { if (alive) setOn(v) }).catch(() => { if (alive) setOn(false) })
    return () => { alive = false }
  }, [supported])

  const toggle = async () => {
    if (busy || on == null) return
    setBusy(true)
    setDenied(false)
    try {
      if (on) {
        await disableConditionAlerts()
        setOn(false)
      } else {
        const ok = await enableConditionAlerts(wishlist, user?.id ?? null)
        setOn(ok)
        if (!ok) setDenied(true)
      }
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
        {denied && <span className="small" style={{ color: 'var(--skip-ink)' }}>Notifications are blocked for this site — allow them in the browser and try again.</span>}
      </span>
      {supported ? (
        <button className={`chip ${on ? 'on' : ''}`} disabled={busy || on == null} onClick={() => void toggle()}>
          {on == null ? '…' : on ? 'Turn off' : 'Turn on'}
        </button>
      ) : (
        <span className="pill info">not supported here</span>
      )}
    </div>
  )
}
