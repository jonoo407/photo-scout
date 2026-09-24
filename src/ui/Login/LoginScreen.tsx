import { useState, type FormEvent } from 'react'
import { IconBrandGoogleFilled, IconMailForward, IconCheck, IconAlertCircle } from '@tabler/icons-react'
import { googleEnabled } from '../../auth/supabase'
import { isNativeApp } from '../../pwa/native'
import { useAuth } from '../../auth/useAuth'
import { hasSignedInBefore } from '../../auth/seen'
import { sitePageUrl } from '../../legal/links'

/* The sign-in screen (design 2e, minus its "continue without an account"
   footnote — V4 decided 2026-09-14). "Make it as easy as possible": Google is
   one tap; otherwise an email and a password is the whole form. A device that
   has never signed in defaults to CREATING the account; one that has, to
   signing in. Either way it is two fields and one tap — and if "create" meets
   an existing account, the store quietly signs in instead.

   No Google inside the native wrapper: the OAuth redirect returns to the web
   origin, never to capacitor://localhost. Passwords are the road there. */

// A self-hosted spot photo, so the first screen costs no network at all.
const HERO = './spot-photos/curtis-hixon-park-tampa-florida-united-states-panora-0b24cd.webp'

const KEEPS = [
  'Saved spots, synced across devices',
  'Your shots, points & medallions',
  'Client shortlists & responses',
  'Hunt progress & finish bonuses',
]

export default function LoginScreen() {
  const status = useAuth((s) => s.status)
  const errorMsg = useAuth((s) => s.errorMsg)
  const linkError = useAuth((s) => s.linkError)
  const dismissLinkError = useAuth((s) => s.dismissLinkError)
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

  return (
    <div className="login">
      <div className="login-hero">
        <img src={HERO} alt="" />
        <p className="login-brand">VANTAGE</p>
      </div>
      <div className="login-body">
        <h1>Know where<br />the light is.</h1>
        <p className="login-sub">
          {showGoogle
            ? 'Free account — one tap with Google, or an email and a password.'
            : 'Free account — an email and a password is all it takes.'}
        </p>

        {linkError && (
          <div className="login-note warn" role="alert">
            <IconAlertCircle size={17} style={{ flex: 'none', marginTop: 1 }} />
            <span>{linkError} <button className="linky" type="button" onClick={dismissLinkError}>Dismiss</button></span>
          </div>
        )}

        {status === 'sent' ? (
          <div className="login-note">
            <IconMailForward size={17} style={{ flex: 'none', marginTop: 1 }} />
            <span>
              Check your email — we sent a link to choose a new password.{' '}
              <button className="linky" type="button" onClick={clearStatus}>Back</button>
            </span>
          </div>
        ) : (
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
          </>
        )}

        <div className="card list login-keeps">
          <div className="row"><span className="rowleft shdr" style={{ margin: 0 }}>AN ACCOUNT KEEPS</span></div>
          {KEEPS.map((k) => (
            <div className="row" key={k}>
              <span className="rowleft small muted"><IconCheck size={13} style={{ color: 'var(--go-ink)' }} /> {k}</span>
            </div>
          ))}
        </div>

        <p className="login-legal">
          By continuing you agree to the{' '}
          <a href={sitePageUrl('terms')} target="_blank" rel="noreferrer">Terms of Use</a> and{' '}
          <a href={sitePageUrl('privacy')} target="_blank" rel="noreferrer">Privacy Policy</a>.
          {' '}Trouble signing in? <a href={sitePageUrl('support')} target="_blank" rel="noreferrer">Get help</a>.
        </p>
      </div>
    </div>
  )
}
