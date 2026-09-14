import { useEffect, useState, type ReactNode } from 'react'
import { authAvailable } from '../../auth/supabase'
import { useAuth } from '../../auth/useAuth'
import LoginScreen from './LoginScreen'
import NewPasswordScreen from './NewPasswordScreen'

/* The sign-in gate (V4, decided 2026-09-14). Every tab screen sits behind it;
   the chrome-free client list (/list) does not — that page is what a CLIENT
   opens, and clients have no account.

   Order of precedence, top to bottom:
   - auth not configured (dev without env) → straight through, as before;
   - session still being restored → a splash, NOT the form: a returning person
     must never see "Sign in" flash before their session lands;
   - a password-reset link brought us here → choose the new password first;
   - nobody signed in → the sign-in screen;
   - otherwise → the app.

   Local-first data survives the gate: pullAndMerge unions this device's
   saved spots, plans and notes into the account on first sign-in. */

/** How long the splash waits for supabase-js before giving up and showing
    the sign-in screen anyway. The session restore is a localStorage read —
    milliseconds — so this only ever fires if the auth chunk failed to load,
    and a form that can at least explain itself beats a logo forever. */
const SPLASH_PATIENCE_MS = 6000

export default function AuthGate({ children }: { children: ReactNode }) {
  const user = useAuth((s) => s.user)
  const status = useAuth((s) => s.status)
  const recovery = useAuth((s) => s.recovery)
  const [impatient, setImpatient] = useState(false)
  const configured = authAvailable()
  const restoring = configured && status === 'idle' && !impatient

  useEffect(() => {
    if (!restoring) return
    const t = setTimeout(() => setImpatient(true), SPLASH_PATIENCE_MS)
    return () => clearTimeout(t)
  }, [restoring])

  if (!configured) return <>{children}</>
  if (restoring) return <Splash />
  if (recovery) return <NewPasswordScreen />
  if (!user) return <LoginScreen />
  return <>{children}</>
}

function Splash() {
  return (
    <div className="login splash" aria-busy="true">
      <img src="./icon.svg" alt="Vantage" width={72} height={72} />
    </div>
  )
}
