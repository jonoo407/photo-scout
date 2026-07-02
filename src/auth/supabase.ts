import type { SupabaseClient } from '@supabase/supabase-js'

/* Supabase client — env-gated and lazy.

   The app is fully usable signed out; auth exists only to sync saved spots
   across devices. Until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set
   (Cloudflare Pages env vars in prod, .env.local in dev) authAvailable() is
   false, the Account UI never renders, and @supabase/supabase-js is never
   even downloaded (dynamic import keeps it out of the main bundle).

   The anon key is a publishable client key by design — data is protected by
   Postgres row-level security (see supabase/schema.sql), not key secrecy. */

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function authAvailable(): boolean {
  return Boolean(URL && KEY)
}

/** Show "Continue with Google" only when the provider is actually configured
 *  (Google Cloud OAuth client + Supabase provider enabled) — flagged via
 *  VITE_AUTH_GOOGLE=1 so a half-configured project never shows a dead button. */
export function googleEnabled(): boolean {
  return authAvailable() && Boolean(import.meta.env.VITE_AUTH_GOOGLE)
}

let client: Promise<SupabaseClient> | null = null

export function getSupabase(): Promise<SupabaseClient> {
  if (!URL || !KEY) throw new Error('auth not configured')
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL, KEY, {
      auth: {
        // PKCE puts ?code= in the query string — the hash router owns the
        // fragment, so the implicit flow's #access_token would collide.
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }),
  )
  return client
}
