import { useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'

/* Where a password-reset link lands (2026-09-14). The link verified in this
   browser, so the person is signed in HERE; this asks for the password they
   will use everywhere else. Skipping is allowed — they are in either way. */
export default function NewPasswordScreen() {
  const status = useAuth((s) => s.status)
  const errorMsg = useAuth((s) => s.errorMsg)
  const updatePassword = useAuth((s) => s.updatePassword)
  const endRecovery = useAuth((s) => s.endRecovery)
  const [password, setPassword] = useState('')
  const busy = status === 'sending'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!password || busy) return
    void updatePassword(password)
  }

  return (
    <div className="login">
      <div className="login-body login-solo">
        <p className="login-brand ink">VANTAGE</p>
        <h1>Choose a new password</h1>
        <p className="login-sub">You're signed in on this device. Pick the password you'll use everywhere else.</p>
        <form className="login-form" onSubmit={submit}>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            placeholder="at least 10 characters"
            aria-label="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="cta" type="submit" disabled={!password || busy}>
            {busy ? 'Saving…' : 'Save password'}
          </button>
        </form>
        {status === 'error' && errorMsg && <p className="login-error" role="alert">{errorMsg}</p>}
        <div className="login-links">
          <button className="linky" type="button" onClick={endRecovery}>Skip for now</button>
        </div>
      </div>
    </div>
  )
}
