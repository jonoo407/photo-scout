import { create } from 'zustand'
import { authAvailable, getSupabase } from './supabase'
import { startSync, stopSync, pullAndMerge } from './sync'
import { consumeEmailLink } from './email-link'

export interface AuthUser {
  id: string
  email: string | null
}

interface AuthState {
  user: AuthUser | null
  /** idle = not configured or not started; ready = listening; sent = magic link emailed */
  status: 'idle' | 'ready' | 'sending' | 'sent' | 'error'
  errorMsg: string | null
  /** A sign-in link from an email failed (expired/used) — shown on Today. */
  linkError: string | null
  signInWithEmail: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  dismissLinkError: () => void
}

/* Session auth state (not persisted by us — supabase-js keeps its own session
   in localStorage and restores it on load). */
export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  errorMsg: null,
  linkError: null,
  dismissLinkError: () => set({ linkError: null }),

  signInWithEmail: async (email: string) => {
    set({ status: 'sending', errorMsg: null })
    try {
      const supabase = await getSupabase()
      // Redirect back to the app root; PKCE lands as ?code= which supabase-js
      // exchanges automatically (detectSessionInUrl).
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + window.location.pathname },
      })
      if (error) throw error
      set({ status: 'sent' })
    } catch (e) {
      set({ status: 'error', errorMsg: e instanceof Error ? e.message : 'Could not send the link' })
    }
  },

  signInWithGoogle: async () => {
    set({ errorMsg: null })
    try {
      const supabase = await getSupabase()
      // Full-page redirect to Google, then back here as ?code= (PKCE) which
      // detectSessionInUrl exchanges automatically.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname },
      })
      if (error) throw error
    } catch (e) {
      set({ status: 'error', errorMsg: e instanceof Error ? e.message : 'Google sign-in failed' })
    }
  },

  signOut: async () => {
    const supabase = await getSupabase()
    await supabase.auth.signOut()
    // onAuthStateChange clears user + stops sync
  },
}))

/** Wire the Supabase session to the auth store + sync engine. Call once at
 *  app start; a no-op until auth is configured. */
export async function initAuth(): Promise<void> {
  if (!authAvailable()) return
  const supabase = await getSupabase()

  supabase.auth.onAuthStateChange((_event, session) => {
    const u = session?.user
    if (u) {
      useAuth.setState({ user: { id: u.id, email: u.email ?? null }, status: 'ready' })
      void pullAndMerge(u.id).then(() => startSync(u.id))
    } else {
      useAuth.setState({ user: null, status: 'ready' })
      stopSync()
    }
    // Tidy the one-time ?code= from an OAuth redirect off the URL.
    if (window.location.search.includes('code=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash)
    }
  })

  // Email links land here with ?token_hash= (see email-link.ts) — verify it
  // in THIS browser, whatever browser that is. Failures surface on Today.
  const result = await consumeEmailLink(() => Promise.resolve(supabase))
  if (result !== 'none' && result !== 'signed-in') {
    useAuth.setState({ linkError: result.error })
  }
}
