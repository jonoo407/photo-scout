/* Which files in the spot-photos bucket are safe to delete.
 *
 * Kept as a pure function with no Deno or Supabase imports so the same code
 * the Edge Function runs is the code the vitest suite exercises — a janitor
 * whose selection logic is only tested by running it is a janitor you find
 * out about after it has deleted something.
 *
 * The conservative choice is always "keep". A file wrongly kept costs a few
 * kilobytes; a file wrongly deleted is somebody's photograph.
 */

export interface StorageObject {
  /** Full object path within the bucket, e.g. "<uid>/<spot>/<ts>-IMG.jpeg". */
  name: string
  /** ISO timestamp, or null/garbage if the API did not give us one. */
  created_at: string | null
}

export interface SelectArgs {
  objects: StorageObject[]
  /** Every `path` currently present in public.user_photos. */
  knownPaths: Set<string>
  now: Date
  graceHours?: number
  maxDeletes?: number
}

/** How long a file gets to exist without a row before it counts as an orphan.
 *  Covers an upload whose row insert is still in flight, and the window in
 *  which the client's own compensation would have cleaned it up anyway. */
export const DEFAULT_GRACE_HOURS = 24

/** Blast radius for one run. A bug that selects everything then deletes 200
 *  files is recoverable-ish; one that deletes 20,000 is not. */
export const DEFAULT_MAX_DELETES = 200

/** Supabase writes these zero-byte markers to represent empty folders. They
 *  have no row and never will; deleting them just makes the folder vanish. */
const PLACEHOLDER = '.emptyFolderPlaceholder'

export function selectOrphans({
  objects, knownPaths, now,
  graceHours = DEFAULT_GRACE_HOURS,
  maxDeletes = DEFAULT_MAX_DELETES,
}: SelectArgs): string[] {
  const cutoff = now.getTime() - graceHours * 3600_000
  const orphans: string[] = []

  for (const o of objects) {
    if (orphans.length >= maxDeletes) break
    if (!o.name) continue
    if (o.name === PLACEHOLDER || o.name.endsWith(`/${PLACEHOLDER}`)) continue
    if (knownPaths.has(o.name)) continue

    // No usable timestamp means we cannot prove the file is past its grace
    // period, and "probably old" is not a good enough reason to delete.
    const created = o.created_at ? Date.parse(o.created_at) : NaN
    if (Number.isNaN(created)) continue
    if (created > cutoff) continue

    orphans.push(o.name)
  }

  return orphans
}
