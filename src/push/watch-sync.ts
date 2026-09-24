import { useStore } from '../state/store'
import { useAuth } from '../auth/useAuth'
import { syncWatch } from './alerts'

/**
 * Keep the Worker's watch list matched to the want-to-go list. No-ops unless
 * the user has already enabled alerts (the facade's platform path checks).
 *
 * Also re-registers when the signed-in user changes (including the session
 * restore at launch): the Worker binds a device to the account in the access
 * token, and a device registered before it verified tokens gets no
 * client-response pushes until it re-registers.
 * Returns the unsubscribe handle (mostly for tests).
 */
export function initWatchSync(): () => void {
  let last = useStore.getState().wishlist
  let lastUser = useAuth.getState().user?.id ?? null
  const offStore = useStore.subscribe((s) => {
    if (s.wishlist === last) return
    last = s.wishlist
    void syncWatch(s.wishlist)
  })
  const offAuth = useAuth.subscribe((s) => {
    const id = s.user?.id ?? null
    if (id === lastUser) return
    lastUser = id
    if (id) void syncWatch(useStore.getState().wishlist)
  })
  return () => { offStore(); offAuth() }
}
