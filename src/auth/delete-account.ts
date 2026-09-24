import { getSupabase } from './supabase'
import { startSync, stopSync } from './sync'
import { forgetSignedIn } from './seen'
import { apiUrl } from '../push/api-base'
import { disableAlerts } from '../push/alerts'
import { useStore, applyTheme } from '../state/store'

/* In-app account deletion (App Store guideline 5.1.1(v), 2026-09-24).

   The server does the deleting: POST /api/account/delete on the Worker, which
   forgets this user's push devices and then has the `delete-account` Edge
   Function remove their Supabase data and auth user (see
   supabase/functions/delete-account/purge.ts for exactly what goes).

   This side's job is what the server cannot reach: this device. Sync stops
   BEFORE the request, so a debounced push cannot land mid-deletion. The local
   copy of saved spots, plans, notes and home is wiped only AFTER the server
   confirms, so a failed attempt loses nothing. Then the session is dropped
   locally — the account it belonged to no longer exists to sign out of. */

export type DeleteAccountResult = { ok: true } | { ok: false; message: string }

export interface DeleteAccountDeps {
  accessToken: () => Promise<string | null>
  post: (url: string, token: string) => Promise<{ ok: boolean; status: number } | null>
  stopSync: () => void
  resumeSync: () => void
  turnOffAlerts: () => Promise<void>
  wipeLocal: () => void
  signOutLocal: () => Promise<void>
}

export async function deleteAccountWith(deps: DeleteAccountDeps): Promise<DeleteAccountResult> {
  const token = await deps.accessToken().catch(() => null)
  if (!token) return { ok: false, message: 'Your session has expired — sign out, sign back in, and try again.' }

  deps.stopSync()
  const res = await deps.post(apiUrl('/api/account/delete'), token).catch(() => null)
  if (!res || !res.ok) {
    deps.resumeSync()
    if (res?.status === 401) {
      return { ok: false, message: 'Your session has expired — sign out, sign back in, and try again.' }
    }
    return { ok: false, message: 'Could not delete your account — nothing was lost. Check your connection and try again.' }
  }

  // The server already forgot every registered device; this also clears the
  // local token and the browser's own push subscription.
  await deps.turnOffAlerts().catch(() => {})
  deps.wipeLocal()
  await deps.signOutLocal().catch(() => {})
  return { ok: true }
}

/** Reset every persisted preference and list to a fresh install's. */
export function wipeLocalData(): void {
  useStore.setState(useStore.getInitialState(), true)
  applyTheme(useStore.getState().theme)
  forgetSignedIn()
}

export async function deleteAccount(userId: string): Promise<DeleteAccountResult> {
  return deleteAccountWith({
    accessToken: async () => {
      const supabase = await getSupabase()
      return (await supabase.auth.getSession()).data.session?.access_token ?? null
    },
    post: async (url, token) => {
      const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      return { ok: res.ok, status: res.status }
    },
    stopSync,
    resumeSync: () => startSync(userId),
    turnOffAlerts: disableAlerts,
    wipeLocal: wipeLocalData,
    signOutLocal: async () => {
      const supabase = await getSupabase()
      await supabase.auth.signOut({ scope: 'local' })
    },
  })
}
