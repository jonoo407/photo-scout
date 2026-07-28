import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { registerSW } from 'virtual:pwa-register'
import './styles/base.css'
import './styles/app.css'
import App from './App'
import { initWatchSync } from './push/watch-sync'
import { wireUpdateChecks } from './pwa/sw-updates'
import { shouldRegisterServiceWorker, purgeServiceWorkers } from './pwa/native'
import { probeCapabilities, formatCapabilities } from './pwa/capabilities'
import { getPosition } from './geo/position'

initWatchSync()

const isNative = Capacitor.isNativePlatform()

/* PWA updates (incident 2026-07-16): the virtual register module reloads the
   page once a new service worker takes control, so nobody keeps running a
   stale bundle. We add our own update checks — hourly, plus whenever the app
   returns to the foreground — because hash routing means the browser's own
   check (full navigations only) may never fire in a long-lived session. */
if (shouldRegisterServiceWorker({ isNative })) {
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
} else {
  /* Native: no worker, and tear down anything a previous build installed —
     its CacheFirst photo cache is what blanked spot thumbnails on build 3.
     The counts are logged because they are the only evidence available for
     whether a worker was ever really running under capacitor://localhost. */
  void purgeServiceWorkers(navigator, globalThis.caches).then(({ unregistered, cachesDeleted }) => {
    console.log(`[pwa] native platform: unregistered ${unregistered} service worker(s), deleted ${cachesDeleted} cache(s)`)
  })

  /* Report what actually works in WKWebView. Screenshots can't see the
     difference between "rendered" and "functional" — build 8 looked perfect
     while geolocation hung forever. ios-simulator.yml asserts on this line. */
  void probeCapabilities(navigator, window, 8000, getPosition)
    .then((r) => console.log(formatCapabilities(r)))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
