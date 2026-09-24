// Account deletion — App Store guideline 5.1.1(v), and GDPR/CCPA erasure.
//
// Settings → Delete account calls the Worker (POST /api/account/delete),
// which drops the user's push registrations from the AlertsDO and then calls
// this with the SAME user access token. This function holds the service role
// and does everything the database side needs: the user's photo rows and
// files, their feedback and suggestions, then the auth user itself (whose FK
// cascades take saved spots, plans, notes, shortlists, votes, hunts, points).
// What goes and why, and the order, live in ./purge.ts.
//
// Auth is the caller's own session, re-verified here with getUser() rather
// than trusted from the Worker: whoever holds a valid access token can delete
// exactly one account — the one it belongs to — and nothing else.
//
// Invoke (what the Worker does):
//   curl -X POST "$URL/functions/v1/delete-account" \
//     -H "Authorization: Bearer $USER_ACCESS_TOKEN" -H "apikey: $PUBLISHABLE_KEY"

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { BUCKET, PurgeError, bearerToken, purgeAccount, type AccountStore } from './purge.ts'

Deno.serve(async (req: Request): Promise<Response> => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status, headers: { 'content-type': 'application/json' },
    })

  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const token = bearerToken(req.headers.get('authorization'))
  if (!token) return json({ error: 'sign in first' }, 401)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const { data: { user }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !user) return json({ error: 'sign in first' }, 401)

  const bucket = admin.storage.from(BUCKET)
  const store: AccountStore = {
    async list(prefix, offset, limit) {
      const { data, error } = await bucket.list(prefix, { limit, offset })
      if (error) throw error
      return (data ?? []).map((o) => ({ name: o.name, id: o.id ?? null }))
    },
    async photoPaths(uid) {
      const { data, error } = await admin.from('user_photos').select('path').eq('owner', uid)
      if (error) throw error
      return (data ?? []).map((r: { path: string }) => r.path)
    },
    async deleteRows(table, column, uid) {
      const { count, error } = await admin.from(table).delete({ count: 'exact' }).eq(column, uid)
      if (error) throw error
      return count ?? 0
    },
    async removeFiles(paths) {
      const { error } = await bucket.remove(paths)
      if (error) throw error
    },
    async deleteUser(uid) {
      const { error } = await admin.auth.admin.deleteUser(uid)
      if (error) throw error
    },
  }

  try {
    const report = await purgeAccount(store, user.id)
    return json({ ok: true, ...report })
  } catch (e) {
    const step = e instanceof PurgeError ? e.step : 'unknown'
    console.error(`delete-account failed at ${step} for ${user.id}:`, e)
    return json({ error: 'could not delete the account', step }, 500)
  }
})
