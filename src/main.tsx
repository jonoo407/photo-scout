import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/base.css'
import './styles/app.css'
import App from './App'
import { initWatchSync } from './push/watch-sync'
import { wireUpdateChecks } from './pwa/sw-updates'

initWatchSync()

/* PWA updates (incident 2026-07-16): the virtual register module reloads the
   page once a new service worker takes control, so nobody keeps running a
   stale bundle. We add our own update checks — hourly, plus whenever the app
   returns to the foreground — because hash routing means the browser's own
   check (full navigations only) may never fire in a long-lived session. */
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    wireUpdateChecks(() => { void registration.update() }, {
      intervalMs: 60 * 60 * 1000,
      minGapMs: 60 * 1000,
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
