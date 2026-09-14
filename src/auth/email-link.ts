import type { SupabaseClient } from '@supabase/supabase-js'

/* Email links that land in the app, verified HERE (incident 2026-07-16).

   The old flow (PKCE ?code= redirect) required a code_verifier stored by the
   browser that REQUESTED the link — but email links routinely open somewhere
   else (Gmail's browser, Safari instead of the installed PWA, another
   device), so sign-in silently failed. The email templates now point at the
   app with a token_hash, and we verify it here: works in any browser, and
   inbox link-scanners can't consume it because only this JS call redeems it.

   Two kinds arrive (2026-09-14): `type=email` (a sign-in / confirmation link)
   and `type=recovery` (a password reset). A recovery lands the person signed
   in on THIS browser and the app then asks for the new password — without
   that step "Forgot password?" was a dead end. */

export interface EmailLinkParams {
  tokenHash: string
  type: 'email' | 'recovery'
}

export function parseEmailLink(search: string): EmailLinkParams | null {
  const p = new URLSearchParams(search)
  const tokenHash = p.get('token_hash')
  const type = p.get('type')
  if (!tokenHash || (type !== 'email' && type !== 'recovery')) return null
  return { tokenHash, type }
}

export type EmailLinkResult = 'none' | 'signed-in' | 'recovery' | { error: string }

export async function consumeEmailLink(getClient: () => Promise<SupabaseClient>): Promise<EmailLinkResult> {
  const params = parseEmailLink(window.location.search)
  if (!params) return 'none'

  // Strip the token from the URL BEFORE verifying: a mid-flight reload (the
  // PWA self-updates!) must not re-consume it and raise a false "expired" error.
  window.history.replaceState(null, '', window.location.pathname + window.location.hash)

  const supabase = await getClient()
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: params.tokenHash, type: params.type })
  if (error || !data.session) {
    return { error: 'That link has expired or already been used — request a fresh one.' }
  }
  return params.type === 'recovery' ? 'recovery' : 'signed-in'
}
