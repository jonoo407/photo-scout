import { create } from 'zustand'
import { authAvailable, getSupabase } from './supabase'
import { startSync, stopSync, pullAndMerge } from './sync'
import { consumeEmailLink } from './email-link'
import { passwordProblem } from './password-rules'
import { rememberSignedIn } from './seen'

export interface AuthUser {
  id: string
  email: string | null
}

interface AuthState {
  user: AuthUser | null
  /** idle = not configured or session not yet restored; ready = listening;
      sending = a request is in flight; sent = a reset email went out. */
  status: 'idle' | 'ready' | 'sending' | 'sent' | 'error'
  errorMsg: string | null
  /** A link from an email failed (expired/used) — shown wherever the person is. */
  linkError: string | null
  /** A neutral one-off message for the sign-in screen (e.g. "account deleted"). */
  notice: string | null
  /** A password-reset link brought us here: ask for the new password before
      anything else. */
  recovery: boolean
  signInWithGoogle: () => Promise<void>
  /* Email + password (2026-07-29; the main road in since the sign-in gate,
     2026-09-14). Google is one tap; otherwise an email and a password is the
     whole form. There is no magic link any more — a link in an inbox is
     neither "type it in" nor "go". */
  signUpWithPassword: (email: string, password: string) => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  /** After a reset link: set the new password, then leave recovery mode. */
  updatePassword: (password: string) => Promise<void>
  /** Leave recovery mode without setting a password (signed in here anyway). */
  endRecovery: () => void
  /** Back from a sent/error state to a usable form. */
  clearStatus: () => void
  signOut: () => Promise<void>
  dismissLinkError: () => void
  dismissNotice: () => void
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

/** signUp's "this email already has an account" reply. With email
    confirmation off (it is — "type it in and go"), Supabase says so plainly
    rather than returning a decoy user. */
function isExistingAccount(e: unknown): boolean {
  const code = (e as { code?: unknown } | null)?.code
  return code === 'user_already_exists' || /already registered/i.test(messageOf(e, ''))
}

/* Session auth state (not persisted by us — supabase-js keeps its own session
   in localStorage and restores it on load). */
export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  errorMsg: null,
  linkError: null,
  notice: null,
  recovery: false,
  dismissLinkError: () => set({ linkError: null }),
  dismissNotice: () => set({ notice: null }),
  clearStatus: () => set({ status: 'ready', errorMsg: null }),
  endRecovery: () => set({ recovery: false, status: 'ready', errorMsg: null }),

  signInWithGoogle: async () => {
    set({ errorMsg: null })
    try {
      const supabase = await getSupabase()
      // Full-page redirect to Google, then back here as ?code= (PKCE) which
      // detectSessionInUrl exchanges automatically.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectHere() },
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
      if (error) {
        if (!isExistingAccount(error)) throw error
        // The screen defaults to "create" on any device that has never signed
        // in — which is also every returning person's new phone. An existing
        // account is not a mistake to report; it is a sign-in to attempt.
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (!signInError) { set({ status: 'ready' }); return }
        set({
          status: 'error',
          errorMsg: 'That email already has an account, and this isn’t its password. Try again, or tap Forgot password.',
        })
        return
      }
      // With confirmations on, signUp returns no session — the user must click
      // the emailed link. With them off (the live setting), they are already
      // in and onAuthStateChange takes over.
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
      // The email template links back with a token_hash (see email-link.ts),
      // so redirectTo only matters for the legacy ConfirmationURL path.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectHere(),
      })
      if (error) throw error
      set({ status: 'sent' })
    } catch (e) {
      set({ status: 'error', errorMsg: messageOf(e, 'Could not send the reset email') })
    }
  },

  updatePassword: async (password: string) => {
    const problem = passwordProblem(password)
    if (problem) { set({ status: 'error', errorMsg: problem }); return }
    set({ status: 'sending', errorMsg: null })
    try {
      const supabase = await getSupabase()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      set({ status: 'ready', recovery: false })
    } catch (e) {
      set({ status: 'error', errorMsg: messageOf(e, 'Could not save the password') })
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

  supabase.auth.onAuthStateChange((event, session) => {
    const u = session?.user
    if (u) {
      useAuth.setState({
        user: { id: u.id, email: u.email ?? null },
        status: 'ready',
        notice: null,
        // supabase-js raises this itself when a legacy ConfirmationURL-style
        // reset lands via detectSessionInUrl.
        ...(event === 'PASSWORD_RECOVERY' ? { recovery: true } : {}),
      })
      rememberSignedIn()
      void pullAndMerge(u.id).then(() => startSync(u.id))
    } else {
      useAuth.setState({ user: null, status: 'ready', recovery: false })
      stopSync()
    }
    // Tidy the one-time ?code= from an OAuth redirect off the URL.
    if (window.location.search.includes('code=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash)
    }
  })

  // Email links land here with ?token_hash= (see email-link.ts) — verify it
  // in THIS browser, whatever browser that is. Failures surface on the
  // sign-in screen (signed out) or Today (signed in).
  const result = await consumeEmailLink(() => Promise.resolve(supabase))
  if (result === 'recovery') {
    useAuth.setState({ recovery: true })
  } else if (result !== 'none' && result !== 'signed-in') {
    useAuth.setState({ linkError: result.error })
  }
}
