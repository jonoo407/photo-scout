import type { ReactNode } from 'react'
import { authAvailable } from '../../auth/supabase'
import { useAuth } from '../../auth/useAuth'
import NewPasswordScreen from './NewPasswordScreen'

/* What stands between a tab screen and the person: since guest browsing
   returned (G1, 2026-09-24, reversing the 2026-09-14 hard gate), only a
   password-reset link — it asks for the new password before anything else.
   Signed out is a first-class way to use the app; the moments that need an
   account ask for one through requireSignIn() and SignInSheet.

   Local-first data survives signing in: pullAndMerge unions this device's
   saved spots, plans and notes into the account on first sign-in. */
export default function AuthGate({ children }: { children: ReactNode }) {
  const recovery = useAuth((s) => s.recovery)
  if (authAvailable() && recovery) return <NewPasswordScreen />
  return <>{children}</>
}
