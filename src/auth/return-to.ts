/* Where to come back to after a Google sign-in (G1, 2026-09-24).

   Google is a full-page redirect that lands back on the bare origin with a
   one-time ?code= — the hash route (the spot, the plan, the hunt the person
   was on) is gone. So the route is stashed just before leaving and restored
   once the session arrives. Session storage, because it belongs to this tab's
   round trip and nothing else. */

const RETURN_KEY = 'vantage.return-to'
/** Long enough to finish a Google consent screen, short enough that an
    abandoned attempt can't hijack some later sign-in. */
const RETURN_TTL_MS = 10 * 60 * 1000

/** Before a full-page OAuth redirect: remember the hash route to come back to. */
export function rememberReturn(hash: string, now = Date.now()): void {
  if (!hash.startsWith('#/')) return
  try { sessionStorage.setItem(RETURN_KEY, JSON.stringify({ hash, at: now })) } catch { /* private mode — lands on Today */ }
}

/** The stashed route (once — it is cleared), or null if absent or stale. */
export function takeReturn(now = Date.now()): string | null {
  let raw: string | null
  try {
    raw = sessionStorage.getItem(RETURN_KEY)
    sessionStorage.removeItem(RETURN_KEY)
  } catch { return null }
  if (!raw) return null
  try {
    const { hash, at } = JSON.parse(raw) as { hash?: unknown; at?: unknown }
    if (typeof hash !== 'string' || !hash.startsWith('#/') || typeof at !== 'number') return null
    return now - at <= RETURN_TTL_MS ? hash : null
  } catch { return null }
}

/**
 * After a sign-in: strip the one-time ?code= from the URL, and if this sign-in
 * came back from the OAuth redirect, put the person back on the screen they
 * left. Any other sign-in just drops a leftover stash.
 */
export function restoreReturn(): void {
  const fromRedirect = window.location.search.includes('code=')
  const back = takeReturn()
  if (!fromRedirect) return
  window.history.replaceState(null, '', window.location.pathname + (back ?? window.location.hash))
  // The hash router only re-reads the URL on popstate.
  if (back) window.dispatchEvent(new PopStateEvent('popstate'))
}
