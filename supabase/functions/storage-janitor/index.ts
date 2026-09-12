// Storage janitor — backlog V10.
//
// Deleting an account cascades the departing user's below-bar `user_photos`
// rows (the prune_departing_photos trigger keeps the good ones, anonymized).
// Their FILES stay in the bucket forever, because Supabase blocks SQL deletes
// on storage.objects — the Storage API is the only way — and the owner's token
// died with the account. Every other cleanup path in this app is client-side
// and runs as the owner, so none of them can reach these.
//
// This is the only thing that can: service_role, server-side, on demand.
//
// It is DRY RUN unless the caller passes {"apply": true}. That is not
// politeness — the whole job is deleting files, and a janitor you cannot ask
// "what would you do?" is a janitor nobody dares run.
//
// Invoke:
//   curl -X POST "$URL/functions/v1/storage-janitor" \
//     -H "x-janitor-secret: $JANITOR_SECRET" \
//     -H 'content-type: application/json' -d '{"apply":false}'
//
// The selection rules live in ./select.ts, which has no Deno imports so the
// vitest suite exercises exactly the code that runs here.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { selectOrphans, DEFAULT_GRACE_HOURS, DEFAULT_MAX_DELETES } from './select.ts'

const BUCKET = 'spot-photos'

Deno.serve(async (req: Request): Promise<Response> => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body, null, 1), {
      status, headers: { 'content-type': 'application/json' },
    })

  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  // Shared secret, not the anon key: this function can delete things, so
  // reaching it must take more than knowing the project URL.
  const expected = Deno.env.get('JANITOR_SECRET')
  if (!expected) return json({ error: 'JANITOR_SECRET is not configured' }, 500)
  if (req.headers.get('x-janitor-secret') !== expected) return json({ error: 'forbidden' }, 403)

  let body: { apply?: boolean; graceHours?: number; maxDeletes?: number } = {}
  try { body = await req.json() } catch { /* an empty body is a dry run */ }

  const apply = body.apply === true
  const graceHours = Number.isFinite(body.graceHours) ? Number(body.graceHours) : DEFAULT_GRACE_HOURS
  const maxDeletes = Number.isFinite(body.maxDeletes) ? Number(body.maxDeletes) : DEFAULT_MAX_DELETES

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )

  // Every file in the bucket, oldest first.
  const { data: objects, error: listErr } = await supabase
    .rpc('storage_objects_for_janitor', { p_limit: 5000 })
  if (listErr) return json({ error: `listing failed: ${listErr.message}` }, 500)

  // Every path still claimed by a row — including rows whose owner is null,
  // which is exactly what account deletion leaves behind for the good photos.
  // Ownership is NOT the test; the presence of a row is.
  const { data: rows, error: rowErr } = await supabase.from('user_photos').select('path')
  if (rowErr) return json({ error: `row read failed: ${rowErr.message}` }, 500)

  const knownPaths = new Set<string>((rows ?? []).map((r: { path: string }) => r.path))
  const orphans = selectOrphans({
    objects: objects ?? [], knownPaths, now: new Date(), graceHours, maxDeletes,
  })

  const report = {
    bucket: BUCKET,
    apply,
    graceHours,
    scanned: (objects ?? []).length,
    claimedByRows: knownPaths.size,
    orphans: orphans.length,
    paths: orphans,
    deleted: 0 as number,
    errors: [] as string[],
  }

  if (!apply || orphans.length === 0) return json(report)

  const { data: removed, error: delErr } = await supabase.storage.from(BUCKET).remove(orphans)
  if (delErr) {
    report.errors.push(delErr.message)
    return json(report, 500)
  }
  report.deleted = (removed ?? []).length
  return json(report)
})
