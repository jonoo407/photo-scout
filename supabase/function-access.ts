/* Who may call each `public` function over PostgREST.
 *
 * Postgres grants EXECUTE to PUBLIC when a function is created, and both
 * `anon` and `authenticated` inherit it — so every function in `public` is
 * callable at /rest/v1/rpc/<name> by anyone on the internet unless something
 * revokes it. The 2026-08-31 Supabase security advisor found 18 such
 * `SECURITY DEFINER` functions; all of them guard themselves internally
 * (auth.uid() checks or a shared secret), so nothing was exploitable, but
 * trigger bodies and retired functions had no business being reachable.
 *
 * This manifest is the intent; `revokeSql()` below generates the migration
 * that enforces it. Keeping the SQL generated rather than hand-written is the
 * point: a hand-written revoke list drifts from the call sites within a
 * release, and `tests/unit/db-function-access.test.ts` scans `src/` and
 * `worker/` for real `.rpc()` calls to prove this manifest still matches them.
 *
 * Levels:
 *   anon          — reachable signed-out. Capability URLs, public aggregates,
 *                   and everything the WORKER calls (it holds only the
 *                   publishable key, so its calls arrive as `anon`).
 *   authenticated — signed-in only. These already refuse anon internally;
 *                   revoking merely takes them off the unauthenticated surface.
 *   internal      — no caller outside the database. Trigger bodies, helpers,
 *                   and functions the client stopped using.
 *   service       — backend jobs only (the storage janitor). Needs an EXPLICIT
 *                   grant: revoking PUBLIC strips service_role's inherited
 *                   EXECUTE too, so "revoke and walk away" breaks the job.
 */

export type Access = 'anon' | 'authenticated' | 'internal' | 'service'

export const FUNCTION_ACCESS: Record<string, Access> = {
  // ── Reachable signed-out ────────────────────────────────────────────────
  // Knowing the uuid IS the authorization; the client has no account.
  get_shortlist: 'anon',
  // Called by worker/index.ts with SUPABASE_PUBLISHABLE_KEY — i.e. as `anon`.
  // Locking these down breaks the shortlist response push + email with no
  // visible symptom in the app. See the Worker test in the suite.
  get_list_owner: 'anon',
  get_owner_email: 'anon',
  // Signed-out visitors browse spots; the function already reduces owners to
  // two initials and filters hidden/blocked rows.
  spot_community_photos: 'anon',
  // Counts only — the raw city_votes table (which maps users to votes) has no
  // anon read of its own.
  city_vote_totals: 'anon',

  // ── Signed-in only ──────────────────────────────────────────────────────
  report_photo: 'authenticated',
  block_photographer: 'authenticated',
  unblock_photographer: 'authenticated',
  blocked_photographers: 'authenticated',
  rate_photo: 'authenticated',
  submit_hunt_stop: 'authenticated',

  // ── No caller outside the database ──────────────────────────────────────
  // Trigger bodies. Postgres checks EXECUTE when the trigger is CREATED, not
  // each time it fires, so revoking here does not stop them running.
  feedback_notify: 'internal',
  photo_report_notify: 'internal',
  enforce_photo_quota: 'internal',
  prune_departing_photos: 'internal',
  notify_shortlist_response: 'internal',
  ensure_photographer_ref: 'internal',
  // Helper called by the quota trigger. Mirrored client-side in
  // src/craft/points.ts, so exposing it leaks nothing — it just has no reason
  // to be an endpoint.
  photo_quota: 'internal',
  // Retired: per-row unblock replaced "unblock all" on 2026-07-29, and
  // block_photo_owner was the pre-ref blocking path. Kept in the database
  // rather than spending a migration to drop them.
  unblock_everyone: 'internal',
  blocked_count: 'internal',
  block_photo_owner: 'internal',

  // ── Backend jobs only ───────────────────────────────────────────────────
  // Reads storage.objects for the orphan-file janitor. Never reachable from
  // a browser: the bucket listing is a map of who uploaded what, and where.
  storage_objects_for_janitor: 'service',
}

/** Identity arguments, as `pg_get_function_identity_arguments` reports them.
 *  Required because REVOKE must name the exact signature. */
export const FUNCTION_ARGS: Record<string, string> = {
  get_shortlist: 'p_id uuid',
  get_list_owner: 'p_id uuid',
  get_owner_email: 'p_id uuid, p_secret text',
  spot_community_photos: 'p_spot_id text',
  city_vote_totals: '',
  report_photo: 'p_photo_id uuid, p_reason text, p_note text',
  block_photographer: 'p_ref uuid',
  unblock_photographer: 'p_ref uuid',
  blocked_photographers: '',
  rate_photo: 'p_photo_id uuid, p_rating integer',
  submit_hunt_stop:
    'p_hunt_id text, p_stop_index integer, p_photo_path text, p_lat double precision, p_lng double precision',
  feedback_notify: '',
  photo_report_notify: '',
  enforce_photo_quota: '',
  prune_departing_photos: '',
  notify_shortlist_response: '',
  ensure_photographer_ref: '',
  photo_quota: 'p_points bigint',
  unblock_everyone: '',
  blocked_count: '',
  block_photo_owner: 'p_photo_id uuid',
  storage_objects_for_janitor: 'p_limit integer',
}

/** Functions whose `search_path` the advisor flagged as mutable. A definer
 *  function with an unpinned search_path can be steered at a shadowed table;
 *  every other function in the schema already pins one. */
const PIN_SEARCH_PATH: Record<string, string> = {
  photo_quota: 'public',
}

/** The migration that makes the manifest true.
 *
 *  Every statement revokes from PUBLIC as well as the named role: revoking
 *  only `anon`/`authenticated` leaves the inherited CREATE-time grant in
 *  place, and the function stays callable. */
export function revokeSql(): string {
  const lines: string[] = [
    '-- Generated from supabase/function-access.ts — edit the manifest, not this.',
    '-- Closes the 2026-08-31 Supabase security advisor findings:',
    '--   anon_security_definer_function_executable (18)',
    '--   authenticated_security_definer_function_executable (20)',
    '--   function_search_path_mutable (1)',
  ]

  for (const [fn, access] of Object.entries(FUNCTION_ACCESS)) {
    if (access === 'anon') continue
    const sig = `public.${fn}(${FUNCTION_ARGS[fn]})`
    lines.push('', `revoke all on function ${sig} from public;`)
    if (access === 'internal') {
      lines.push(`revoke all on function ${sig} from anon, authenticated;`)
    } else if (access === 'service') {
      lines.push(`revoke all on function ${sig} from anon, authenticated;`)
      lines.push(`grant execute on function ${sig} to service_role;`)
    } else {
      lines.push(`revoke all on function ${sig} from anon;`)
      lines.push(`grant execute on function ${sig} to authenticated;`)
    }
  }

  for (const [fn, path] of Object.entries(PIN_SEARCH_PATH)) {
    lines.push('', `alter function public.${fn}(${FUNCTION_ARGS[fn]}) set search_path = ${path};`)
  }

  return lines.join('\n') + '\n'
}
