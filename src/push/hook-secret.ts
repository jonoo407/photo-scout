/* Shared-secret check for the Supabase database webhooks (2026-09-24).

   pg_net posts to /api/shortlist/response-hook, /api/feedback-hook and
   /api/report-hook. Those routes send push and email, and the email leg
   shares Resend's quota with the auth mail (password resets), so an
   unauthenticated hook let anyone on the internet flood an inbox and starve
   sign-in of email. The trigger functions now send this header, read from
   internal.config.worker_hook_secret — the same value as the Worker secret
   SUPABASE_HOOK_SECRET that already gates get_owner_email(). */

export const HOOK_SECRET_HEADER = 'x-vantage-hook-secret'

const sha256 = async (s: string) =>
  new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))

/** Constant-time: both sides are hashed first so neither the length nor a
    matching prefix of the configured secret shows up in response timing. */
export async function hookSecretMatches(
  expected: string | undefined, presented: string | null,
): Promise<boolean> {
  if (!expected || !presented) return false
  const [a, b] = await Promise.all([sha256(expected), sha256(presented)])
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}
