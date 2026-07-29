import { create } from 'zustand'
import { authAvailable, getSupabase } from './supabase'
import { startSync, stopSync, pullAndMerge } from './sync'
import { consumeEmailLink } from './email-link'
import { passwordProblem } from './password-rules'

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
  /* Password auth (2026-07-29). Magic links remain the default and the
     recommended path; passwords exist because a link cannot be handed to
     someone — an App Store reviewer, most concretely — and because some email
     clients mangle or pre-consume links. */
  signUpWithPassword: (email: string, password: string) => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  signOut: () => Promise<void>
  dismissLinkError: () => void
}

const redirectHere = () => window.location.origin + window.location.pathname

/** Supabase surfaces failures as an `error` object on the result, not as a
    thrown Error, so `instanceof Error` silently loses the real message and
    everything degrades to the fallback. Read `.message` off whatever arrives. */
function messageOf(e: unknown, fallback: string): string {
  if (typeof e === 'string') return e || fallback
  const m = (e as { message?: unknown } | null)?.message
  return typeof m === 'string' && m ? m : fallback
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
      set({ status: 'error', errorMsg: messageOf(e, 'Could not send the link') })
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
      set({ status: 'error', errorMsg: messageOf(e, 'Google sign-in failed') })
    }
  },

  signUpWithPassword: async (email: string, password: string) => {
    // Check locally first so a weak password costs one keystroke of feedback
    // rather than a round trip and a generic server error.
    const problem = passwordProblem(password)
    if (problem) { set({ status: 'error', errorMsg: problem }); return }
    set({ status: 'sending', errorMsg: null })
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { emailRedirectTo: redirectHere() },
      })
      if (error) throw error
      // With confirmations on, signUp returns no session — the user must click
      // the emailed link. With them off, they are already in and
      // onAuthStateChange takes over.
      set({ status: data?.session ? 'ready' : 'sent' })
    } catch (e) {
      set({ status: 'error', errorMsg: messageOf(e, 'Could not create the account') })
    }
  },

  signInWithPassword: async (email: string, password: string) => {
    // No strength check here — that would lock out anyone holding a password
    // set before the rules tightened. Strength is enforced where one is CHOSEN.
    set({ status: 'sending', errorMsg: null })
    try {
      const supabase = await getSupabase()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      set({ status: 'ready' })
    } catch (e) {
      const raw = messageOf(e, '')
      // Supabase says "Invalid login credentials" for both a wrong password and
      // an unknown email — deliberately, so the endpoint isn't an account
      // oracle. Keep that property, but say it in plain words.
      set({
        status: 'error',
        errorMsg: /invalid login credentials/i.test(raw)
          ? 'That email or password is wrong.'
          : raw || 'Could not sign in',
      })
    }
  },

  sendPasswordReset: async (email: string) => {
    set({ status: 'sending', errorMsg: null })
    try {
      const supabase = await getSupabase()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectHere(),
      })
      if (error) throw error
      set({ status: 'sent' })
    } catch (e) {
      set({ status: 'error', errorMsg: messageOf(e, 'Could not send the reset email') })
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
