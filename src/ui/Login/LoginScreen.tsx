import { useEffect } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { IconCheck, IconAlertCircle } from '@tabler/icons-react'
import { authAvailable, googleEnabled } from '../../auth/supabase'
import { isNativeApp } from '../../pwa/native'
import { useAuth } from '../../auth/useAuth'
import { safeNext } from '../../auth/sign-in-prompt'
import SignInForm from './SignInForm'

/* The sign-in page, /signin?next=<route> (design 2e). It is where the "Sign in"
   rows on You and Settings lead; the moments that NEED an account (save,
   alerts, upload, rate, vote, hunt, client list) ask with the lighter sheet
   instead (SignInSheet). Browsing never needs either — "Continue without an
   account" goes straight back, and so does a finished sign-in. */

// A self-hosted spot photo, so the first screen costs no network at all.
const HERO = './spot-photos/curtis-hixon-park-tampa-florida-united-states-panora-0b24cd.webp'

const KEEPS = [
  'Saved spots, synced across devices',
  'Your shots, points & medallions',
  'Client shortlists & responses',
  'Hunt progress & finish bonuses',
]

export default function LoginScreen() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const user = useAuth((s) => s.user)
  const linkError = useAuth((s) => s.linkError)
  const dismissLinkError = useAuth((s) => s.dismissLinkError)
  const notice = useAuth((s) => s.notice)
  const dismissNotice = useAuth((s) => s.dismissNotice)
  const showGoogle = googleEnabled() && !isNativeApp()

  useEffect(() => {
    if (user) nav(next, { replace: true })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!authAvailable()) return <Navigate to={next} replace />

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

        {notice && (
          <div className="login-note" role="status">
            <IconCheck size={17} style={{ flex: 'none', marginTop: 1 }} />
            <span>{notice} <button className="linky" type="button" onClick={dismissNotice}>Dismiss</button></span>
          </div>
        )}

        {linkError && (
          <div className="login-note warn" role="alert">
            <IconAlertCircle size={17} style={{ flex: 'none', marginTop: 1 }} />
            <span>{linkError} <button className="linky" type="button" onClick={dismissLinkError}>Dismiss</button></span>
          </div>
        )}

        <SignInForm />

        <div className="card list login-keeps">
          <div className="row"><span className="rowleft shdr" style={{ margin: 0 }}>AN ACCOUNT KEEPS</span></div>
          {KEEPS.map((k) => (
            <div className="row" key={k}>
              <span className="rowleft small muted"><IconCheck size={13} style={{ color: 'var(--go-ink)' }} /> {k}</span>
            </div>
          ))}
        </div>

        <p className="center-note small">
          <button className="linky" type="button" onClick={() => nav(next, { replace: true })}>
            Continue without an account
          </button>
        </p>
      </div>
    </div>
  )
}
