import { create } from 'zustand'
import { authAvailable, getSupabase } from './supabase'
import { startSync, stopSync, pullAndMerge } from './sync'

export interface AuthUser {
  id: string
  email: string | null
}

interface AuthState {
  user: AuthUser | null
  /** idle = not configured or not started; ready = listening; sent = magic link emailed */
  status: 'idle' | 'ready' | 'sending' | 'sent' | 'error'
  errorMsg: string | null
  signInWithEmail: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

/* Session auth state (not persisted by us — supabase-js keeps its own session
   in localStorage and restores it on load). */
export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  errorMsg: null,

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
    // Tidy the one-time ?code= from the magic-link redirect off the URL.
    if (window.location.search.includes('code=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash)
    }
  })
}
