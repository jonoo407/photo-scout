import { IconRefresh, IconSunset2 } from '@tabler/icons-react'

/* Branded recovery screen (router errorElement). Unexpected render errors —
   most often a stale session straddling a deploy — land here instead of
   React Router's raw developer screen. Reload is the healer: the updated
   service worker already controls the page, so a reload boots fresh code. */
export default function ErrorScreen() {
  return (
    <div className="screen" style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="empty">
        <IconSunset2 size={32} />
        <p className="et">Something went sideways</p>
        <p className="es">
          Usually this just means the app updated underneath you.
          A quick reload picks up the latest version.
        </p>
        <button className="cta" style={{ maxWidth: 240, margin: '4px auto 10px' }} onClick={() => window.location.reload()}>
          <IconRefresh size={17} /> Reload Vantage
        </button>
        <a href="#/" className="small" style={{ color: 'var(--terracotta)' }}>or head back to Today</a>
      </div>
    </div>
  )
}
