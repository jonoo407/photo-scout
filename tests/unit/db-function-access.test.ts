import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { FUNCTION_ACCESS, revokeSql, type Access } from '../../supabase/function-access'

/* Every `SECURITY DEFINER` function in `public` is reachable over PostgREST at
   /rest/v1/rpc/<name> by whoever holds EXECUTE. Postgres grants EXECUTE to
   PUBLIC on creation, so a function is exposed to the whole internet the moment
   it exists unless something revokes it — which is how 18 of them ended up
   anon-callable (Supabase security advisor, 2026-08-31, still open 2026-09-11).

   `supabase/function-access.ts` is the intended access level for each one, and
   the SQL that enforces it is generated from that manifest rather than
   hand-written, so the two can never drift. These tests guard the manifest
   against the two ways it could be wrong:

     · too tight — a function the app actually calls gets locked out, which
       would be a silent production break (the shortlist email leg is exactly
       this shape: the WORKER calls it with the publishable/anon key, so
       "only the Worker uses it" does NOT mean "revoke anon"), and
     · too loose — a trigger-only function stays callable by strangers.

   The call sites are scanned from the real source rather than listed here, so
   adding an `.rpc()` call without deciding its access level fails the build. */

const root = resolve(__dirname, '../..')

function filesUnder(dir: string, exts: string[]): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return filesUnder(full, exts)
    return exts.some((e) => entry.endsWith(e)) ? [full] : []
  })
}

/** Functions the browser client calls: `supabase.rpc('name', …)`. */
function clientRpcNames(): string[] {
  const names = new Set<string>()
  for (const file of filesUnder(join(root, 'src'), ['.ts', '.tsx'])) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/\.rpc\(\s*'([a-z_]+)'/g)) names.add(m[1])
  }
  return [...names].sort()
}

/** Functions the Cloudflare Worker calls: `supabaseRpc(env, 'name', …)`. */
function workerRpcNames(): string[] {
  const names = new Set<string>()
  for (const file of filesUnder(join(root, 'worker'), ['.ts'])) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/supabaseRpc(?:<[^>]*>)?\(\s*env\s*,\s*'([a-z_]+)'/g)) names.add(m[1])
  }
  return [...names].sort()
}

const permits: Record<Access, { anon: boolean; authenticated: boolean }> = {
  anon: { anon: true, authenticated: true },
  authenticated: { anon: false, authenticated: true },
  internal: { anon: false, authenticated: false },
}

describe('database function access manifest', () => {
  it('covers every function the browser client calls', () => {
    for (const fn of clientRpcNames()) {
      expect(FUNCTION_ACCESS, `${fn} is called by the client but has no declared access level`)
        .toHaveProperty(fn)
    }
  })

  it('leaves every client-called function reachable by a signed-in user', () => {
    for (const fn of clientRpcNames()) {
      const access = FUNCTION_ACCESS[fn]
      expect(permits[access].authenticated, `${fn} is called by the client but marked '${access}'`).toBe(true)
    }
  })

  it('keeps every Worker-called function reachable by anon', () => {
    // The Worker holds only SUPABASE_PUBLISHABLE_KEY, so its calls arrive as
    // the `anon` role. Marking one of these 'authenticated' or 'internal'
    // breaks the shortlist notify/email leg with no client-side symptom.
    const called = workerRpcNames()
    expect(called.length).toBeGreaterThan(0)
    for (const fn of called) {
      expect(FUNCTION_ACCESS, `${fn} is called by the Worker but has no declared access level`)
        .toHaveProperty(fn)
      expect(FUNCTION_ACCESS[fn], `${fn} is called by the Worker with the anon key`).toBe('anon')
    }
  })

  it('marks the trigger-only functions internal — nothing may call them over REST', () => {
    // Trigger bodies run as part of an INSERT; no caller ever names them.
    for (const fn of [
      'feedback_notify',
      'photo_report_notify',
      'enforce_photo_quota',
      'prune_departing_photos',
      'notify_shortlist_response',
      'ensure_photographer_ref',
    ]) {
      expect(FUNCTION_ACCESS[fn], `${fn} is a trigger body`).toBe('internal')
    }
  })

  it('marks functions no caller uses internal', () => {
    // Kept in the database rather than spending a migration to drop them,
    // but nothing should be able to reach them from outside.
    const reachable = new Set([...clientRpcNames(), ...workerRpcNames()])
    for (const fn of ['unblock_everyone', 'blocked_count', 'block_photo_owner']) {
      expect(reachable.has(fn), `${fn} is expected to be unused by every caller`).toBe(false)
      expect(FUNCTION_ACCESS[fn], `${fn} has no caller`).toBe('internal')
    }
  })
})

describe('generated lockdown SQL', () => {
  const sql = revokeSql()

  it('revokes both roles on every internal function', () => {
    for (const [fn, access] of Object.entries(FUNCTION_ACCESS)) {
      if (access !== 'internal') continue
      expect(sql).toContain(`revoke all on function public.${fn}`)
      expect(sql).toMatch(new RegExp(`revoke all on function public\\.${fn}\\([^)]*\\) from anon, authenticated;`))
    }
  })

  it('revokes only anon on authenticated-level functions, and re-grants nothing to anon', () => {
    for (const [fn, access] of Object.entries(FUNCTION_ACCESS)) {
      if (access !== 'authenticated') continue
      expect(sql).toMatch(new RegExp(`revoke all on function public\\.${fn}\\([^)]*\\) from anon;`))
      expect(sql).toMatch(new RegExp(`grant execute on function public\\.${fn}\\([^)]*\\) to authenticated;`))
    }
  })

  it('never revokes a function that anon must keep', () => {
    for (const [fn, access] of Object.entries(FUNCTION_ACCESS)) {
      if (access !== 'anon') continue
      expect(sql).not.toMatch(new RegExp(`revoke [a-z ]*on function public\\.${fn}\\(`))
    }
  })

  it('revokes the blanket PUBLIC grant that exposed these in the first place', () => {
    // Postgres grants EXECUTE to PUBLIC on CREATE FUNCTION. Revoking only from
    // anon/authenticated leaves that inherited grant in place, so every
    // statement must strip PUBLIC too or the lockdown does nothing.
    for (const [fn, access] of Object.entries(FUNCTION_ACCESS)) {
      if (access === 'anon') continue
      expect(sql).toMatch(new RegExp(`revoke all on function public\\.${fn}\\([^)]*\\) from public;`))
    }
  })

  it('pins the mutable search_path the advisor flagged', () => {
    expect(sql).toMatch(/alter function public\.photo_quota\([^)]*\) set search_path = public/)
  })
})
