/* Stale-session defense (incident 2026-07-16): the browser only checks for a
   new service worker on full navigations — a hash-routed PWA resumed from the
   background can run last week's bundle indefinitely. So we ask for update
   checks ourselves: on an interval, and whenever the app returns to the
   foreground (throttled). The virtual:pwa-register module reloads the page
   once the fresh worker takes control. */

export interface UpdateCheckOptions {
  /** How often to check while the app stays open. */
  intervalMs: number
  /** Minimum gap between foreground-triggered checks. */
  minGapMs: number
}

export function wireUpdateChecks(check: () => void, opts: UpdateCheckOptions): () => void {
  let lastCheck = -Infinity // first foreground return always checks
  const run = () => { lastCheck = Date.now(); check() }

  const timer = setInterval(run, opts.intervalMs)
  const onVisibility = () => {
    if (document.visibilityState !== 'visible') return
    if (Date.now() - lastCheck < opts.minGapMs) return
    run()
  }
  document.addEventListener('visibilitychange', onVisibility)

  return () => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}
