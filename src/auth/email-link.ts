import type { SupabaseClient } from '@supabase/supabase-js'

/* Magic-link sign-in v2 (incident 2026-07-16).

   The old flow (PKCE ?code= redirect) required a code_verifier stored by the
   browser that REQUESTED the link — but email links routinely open somewhere
   else (Gmail's browser, Safari instead of the installed PWA, another
   device), so sign-in silently failed. The email template now points at the
   app with a token_hash, and we verify it here: works in any browser, and
   inbox link-scanners can't consume it because only this JS call redeems it. */

export interface EmailLinkParams {
  tokenHash: string
  type: 'email'
}

export function parseEmailLink(search: string): EmailLinkParams | null {
  const p = new URLSearchParams(search)
  const tokenHash = p.get('token_hash')
  if (!tokenHash || p.get('type') !== 'email') return null
  return { tokenHash, type: 'email' }
}

export type EmailLinkResult = 'none' | 'signed-in' | { error: string }

export async function consumeEmailLink(getClient: () => Promise<SupabaseClient>): Promise<EmailLinkResult> {
  const params = parseEmailLink(window.location.search)
  if (!params) return 'none'

  // Strip the token from the URL BEFORE verifying: a mid-flight reload (the
  // PWA self-updates!) must not re-consume it and raise a false "expired" error.
  window.history.replaceState(null, '', window.location.pathname + window.location.hash)

  const supabase = await getClient()
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: params.tokenHash, type: params.type })
  if (error || !data.session) {
    return { error: 'That sign-in link has expired or already been used — request a fresh one from Settings → Account.' }
  }
  return 'signed-in'
}
