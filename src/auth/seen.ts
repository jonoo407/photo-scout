/* Whether this device has ever completed a sign-in (2026-09-14).

   Decides which way the sign-in screen leans. A fresh device defaults to
   CREATING an account, so a new person types an email and a password and taps
   once; a device that has signed in before defaults to signing in, so a
   returning person does exactly the same two things. Local and never synced —
   this is about the device in hand, not the person. */

export const SEEN_KEY = 'vantage.signed-in-before'

export function hasSignedInBefore(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === '1' } catch { return false }
}

export function rememberSignedIn(): void {
  try { localStorage.setItem(SEEN_KEY, '1') } catch { /* private mode, quota — the default just leans "create" */ }
}
