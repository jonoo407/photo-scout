import { useStore } from '../state/store'
import { useAuth } from '../auth/useAuth'
import { syncWatch } from './alerts'

/**
 * Keep the Worker's watch list matched to the want-to-go list. No-ops unless
 * the user has already enabled alerts (the facade's platform path checks).
 * Returns the unsubscribe handle (mostly for tests).
 */
export function initWatchSync(): () => void {
  let last = useStore.getState().wishlist
  return useStore.subscribe((s) => {
    if (s.wishlist === last) return
    last = s.wishlist
    void syncWatch(s.wishlist, useAuth.getState().user?.id ?? null)
  })
}
