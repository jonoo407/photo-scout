import { useState, type FormEvent } from 'react'
import { IconBrandGoogleFilled, IconMailForward } from '@tabler/icons-react'
import { googleEnabled } from '../../auth/supabase'
import { isNativeApp } from '../../pwa/native'
import { useAuth } from '../../auth/useAuth'
import { hasSignedInBefore } from '../../auth/seen'
import { sitePageUrl } from '../../legal/links'

/* The sign-in controls, shared by the full sign-in page (design 2e) and the
   contextual sheet (4b). "Make it as easy as possible": Google is one tap;
   otherwise an email and a password is the whole form. A device that has
   never signed in defaults to CREATING the account; one that has, to signing
   in. Either way it is two fields and one tap — and if "create" meets an
   existing account, the store quietly signs in instead.

   No Google inside the native wrapper: the OAuth redirect returns to the web
   origin, never to capacitor://localhost. Passwords are the road there. */
export default function SignInForm() {
  const status = useAuth((s) => s.status)
  const errorMsg = useAuth((s) => s.errorMsg)
  const clearStatus = useAuth((s) => s.clearStatus)
  const signInWithGoogle = useAuth((s) => s.signInWithGoogle)
  const signInWithPassword = useAuth((s) => s.signInWithPassword)
  const signUpWithPassword = useAuth((s) => s.signUpWithPassword)
  const sendPasswordReset = useAuth((s) => s.sendPasswordReset)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(() => !hasSignedInBefore())

  const busy = status === 'sending'
  const canSubmit = !!email.trim() && !!password && !busy
  const showGoogle = googleEnabled() && !isNativeApp()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    void (creating ? signUpWithPassword : signInWithPassword)(email.trim(), password)
  }

  if (status === 'sent') {
    return (
      <div className="login-note">
        <IconMailForward size={17} style={{ flex: 'none', marginTop: 1 }} />
        <span>
          Check your email — we sent a link to choose a new password.{' '}
          <button className="linky" type="button" onClick={clearStatus}>Back</button>
        </span>
      </div>
    )
  }

  return (
    <>
      {showGoogle && (
        <>
          <button className="cta google" type="button" disabled={busy} onClick={() => void signInWithGoogle()}>
            <IconBrandGoogleFilled size={17} /> Continue with Google
          </button>
          <div className="login-or"><span /><span className="small tertiary">or</span><span /></div>
        </>
      )}
      <form className="login-form" onSubmit={submit}>
        <input
          className="field"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="you@email.com"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="field"
          type="password"
          // Tells a password manager whether to offer a saved secret or
          // generate a new one. Getting this wrong is why so many
          // sign-up forms fight the browser.
          autoComplete={creating ? 'new-password' : 'current-password'}
          placeholder={creating ? 'choose a password — 10+ characters' : 'your password'}
          aria-label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="cta" type="submit" disabled={!canSubmit}>
          {busy ? 'Working…' : creating ? 'Create account' : 'Sign in'}
        </button>
      </form>
      {status === 'error' && errorMsg && <p className="login-error" role="alert">{errorMsg}</p>}
      <div className="login-links">
        <button className="linky" type="button" onClick={() => { setCreating(!creating); setPassword('') }}>
          {creating ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
        {!creating && (
          <button
            className="linky"
            type="button"
            disabled={!email.trim() || busy}
            onClick={() => void sendPasswordReset(email.trim())}
          >
            Forgot password?
          </button>
        )}
      </div>
      <p className="login-legal">
        By continuing you agree to the{' '}
        <a href={sitePageUrl('terms')} target="_blank" rel="noreferrer">Terms of Use</a> and{' '}
        <a href={sitePageUrl('privacy')} target="_blank" rel="noreferrer">Privacy Policy</a>.
        {' '}Trouble signing in? <a href={sitePageUrl('support')} target="_blank" rel="noreferrer">Get help</a>.
      </p>
    </>
  )
}
