import { useState } from 'react'
import {
  IconUserCircle, IconMailForward, IconCloudCheck, IconLogout,
  IconBrandGoogleFilled, IconLock,
} from '@tabler/icons-react'
import { authAvailable, googleEnabled } from '../../auth/supabase'
import { isNativeApp } from '../../pwa/native'
import { useAuth } from '../../auth/useAuth'

/* Account row for Settings. Hidden entirely until auth is configured; the app
   never gates anything behind sign-in — an account only adds cross-device sync
   and the community features.

   The emailed magic link is the DEFAULT and stays first: nothing to remember,
   nothing to leak. The password path (added 2026-07-29) is deliberately one
   tap away rather than absent, because a link cannot be handed to anyone — an
   App Store reviewer needs credentials they can actually type — and because
   some mail clients pre-fetch or mangle links. */
export default function AccountSection() {
  const user = useAuth((s) => s.user)
  const status = useAuth((s) => s.status)
  const errorMsg = useAuth((s) => s.errorMsg)
  const signInWithEmail = useAuth((s) => s.signInWithEmail)
  const signInWithGoogle = useAuth((s) => s.signInWithGoogle)
  const signInWithPassword = useAuth((s) => s.signInWithPassword)
  const signUpWithPassword = useAuth((s) => s.signUpWithPassword)
  const sendPasswordReset = useAuth((s) => s.sendPasswordReset)
  const signOut = useAuth((s) => s.signOut)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Native defaults to password: an emailed link opens in Safari and signs
  // into the WEB app, never the wrapper. Password is the path that works here.
  const [mode, setMode] = useState<'link' | 'password'>(isNativeApp() ? 'password' : 'link')
  const [creating, setCreating] = useState(false)

  if (!authAvailable()) return null

  const busy = status === 'sending'
  const canSubmitPassword = !!email.trim() && !!password && !busy

  const emailField = (
    <input
      className="addrinput"
      type="email"
      inputMode="email"
      autoComplete="email"
      placeholder="your email"
      aria-label="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
  )

  return (
    <>
      <p className="shdr">ACCOUNT</p>
      <div className="card list">
        {user ? (
          <>
            <div className="row">
              <span className="rowleft"><IconUserCircle size={18} /> {user.email ?? 'Signed in'}</span>
              <span className="pill open"><IconCloudCheck size={12} /> Sync on</span>
            </div>
            <p className="small tertiary" style={{ margin: '0 2px 8px' }}>
              Saved spots, shot checklists and settings are synced across your devices.
            </p>
            <button className="row last" onClick={() => void signOut()}>
              <span className="rowleft" style={{ color: 'var(--terracotta)' }}><IconLogout size={18} /> Sign out</span>
            </button>
          </>
        ) : status === 'sent' ? (
          <p className="small" style={{ margin: '2px 2px 8px', lineHeight: 1.6 }}>
            <IconMailForward size={15} style={{ verticalAlign: '-2px' }} /> Check your email and tap the
            link we just sent.
          </p>
        ) : mode === 'password' ? (
          <>
            <div className="row">
              <span className="rowleft"><IconUserCircle size={18} /> Email</span>
              <span className="addrset">{emailField}</span>
            </div>
            <div className="row">
              <span className="rowleft"><IconLock size={18} /> Password</span>
              <span className="addrset">
                <input
                  className="addrinput"
                  type="password"
                  // Tells a password manager whether to offer a saved secret or
                  // generate a new one. Getting this wrong is why so many
                  // sign-up forms fight the browser.
                  autoComplete={creating ? 'new-password' : 'current-password'}
                  placeholder={creating ? 'at least 10 characters' : 'your password'}
                  aria-label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' || !canSubmitPassword) return
                    void (creating ? signUpWithPassword : signInWithPassword)(email.trim(), password)
                  }}
                />
              </span>
            </div>
            <button
              className="row"
              disabled={!canSubmitPassword}
              onClick={() => void (creating ? signUpWithPassword : signInWithPassword)(email.trim(), password)}
            >
              <span className="rowleft" style={{ color: 'var(--terracotta)' }}>
                <IconLock size={18} /> {busy ? 'Working…' : creating ? 'Create account' : 'Sign in'}
              </span>
            </button>
            {status === 'error' && errorMsg && (
              <p className="small" style={{ color: 'var(--skip-ink)', margin: '0 2px 8px' }}>{errorMsg}</p>
            )}
            <div className="row last" style={{ flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' }}>
              <button className="linky" onClick={() => { setCreating(!creating); setPassword('') }}>
                {creating ? 'I already have an account' : 'No account? Create one'}
              </button>
              {!creating && (
                <button
                  className="linky"
                  disabled={!email.trim() || busy}
                  onClick={() => void sendPasswordReset(email.trim())}
                >
                  Forgot password?
                </button>
              )}
              <button className="linky" onClick={() => { setMode('link'); setPassword('') }}>
                Email me a link instead
              </button>
            </div>
          </>
        ) : (
          <>
            {googleEnabled() && !isNativeApp() && (
              <button className="row" onClick={() => void signInWithGoogle()}>
                <span className="rowleft" style={{ color: 'var(--terracotta)' }}>
                  <IconBrandGoogleFilled size={18} /> Continue with Google
                </span>
              </button>
            )}
            <div className="row">
              <span className="rowleft"><IconUserCircle size={18} /> Sign in</span>
              <span className="addrset">{emailField}</span>
            </div>
            <button
              className="row"
              onClick={() => { if (email.trim()) void signInWithEmail(email.trim()) }}
              disabled={busy || !email.trim()}
            >
              <span className="rowleft" style={{ color: 'var(--terracotta)' }}>
                <IconMailForward size={18} /> {busy ? 'Sending…' : 'Send sign-in link'}
              </span>
            </button>
            {status === 'error' && errorMsg && (
              <p className="small" style={{ color: 'var(--skip-ink)', margin: '0 2px 8px' }}>{errorMsg}</p>
            )}
            <div className="row last">
              <button className="linky" onClick={() => setMode('password')}>Use a password instead</button>
            </div>
            <p className="small tertiary" style={{ margin: '0 2px 8px' }}>
              No password needed — we email you a link. Signing in syncs your saved spots
              across devices.
            </p>
          </>
        )}
      </div>
    </>
  )
}
