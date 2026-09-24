/* What deleting an account removes, and in what order.
 *
 * Kept free of Deno and Supabase imports, like storage-janitor/select.ts, so
 * the vitest suite runs the same code the Edge Function does. index.ts adapts
 * a service-role client to the narrow `AccountStore` below.
 *
 * Deleting the auth user alone is not enough, for three reasons:
 *   · prune_departing_photos KEEPS well-rated shots as anonymous community
 *     content. That is right for an account that lapses, wrong for someone
 *     who asked for their data to be deleted — so every row goes first.
 *   · Supabase blocks SQL deletes on storage.objects, so no cascade can reach
 *     the files. Only the Storage API can.
 *   · feedback and spot_suggestions are `on delete set null`. Feedback can
 *     carry a contact email, so "set null" would keep personal data.
 *
 * Everything else the user owns (vantage_state — saved spots, plans, notes —
 * shortlists and their responses, city_votes, hunts, points, blocks,
 * photographer refs) is removed by the FK cascade when the auth user goes.
 * photo_reports they FILED survive with reporter = null: the moderation
 * record outlives the reporter by design.
 *
 * Order is chosen so a failure part-way is always safe to retry: nothing
 * irreversible for the ACCOUNT happens until its data is gone, and a retry
 * re-lists the bucket rather than trusting rows that may already be deleted. */

export const BUCKET = 'spot-photos'

/** Storage list() page size. Supabase caps a page at 1000; 100 is its default. */
export const LIST_PAGE = 100

/** Paths per Storage remove() call — the API rejects very large batches. */
export const REMOVE_BATCH = 100

/** One entry from a Storage folder listing. Folders come back with id null. */
export interface ListedObject {
  name: string
  id: string | null
}

export interface AccountStore {
  /** One page of a folder in the photo bucket. */
  list(prefix: string, offset: number, limit: number): Promise<ListedObject[]>
  /** `path` of every user_photos row the user owns. */
  photoPaths(uid: string): Promise<string[]>
  /** Delete rows where `column` = uid; returns how many went. */
  deleteRows(table: string, column: string, uid: string): Promise<number>
  removeFiles(paths: string[]): Promise<void>
  deleteUser(uid: string): Promise<void>
}

/** Rows to remove explicitly, before the auth user. Everything not listed
 *  here cascades off auth.users. */
export const OWNED_ROWS: ReadonlyArray<{ table: string; column: string }> = [
  { table: 'user_photos', column: 'owner' },
  { table: 'feedback', column: 'submitted_by' },
  { table: 'spot_suggestions', column: 'suggested_by' },
]

export type PurgeStep = 'list' | 'rows' | 'files' | 'user'

export class PurgeError extends Error {
  constructor(readonly step: PurgeStep, message: string) {
    super(message)
  }
}

export interface PurgeReport {
  files: number
  rows: Record<string, number>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The token from an `Authorization: Bearer …` header, or null. */
export function bearerToken(header: string | null | undefined): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(header?.trim() ?? '')
  return m ? m[1] : null
}

async function listAll(store: AccountStore, prefix: string): Promise<ListedObject[]> {
  const out: ListedObject[] = []
  for (let offset = 0; ; offset += LIST_PAGE) {
    const page = await store.list(prefix, offset, LIST_PAGE)
    out.push(...page)
    if (page.length < LIST_PAGE) return out
  }
}

/** Every file under `<uid>/` in the bucket (uploads are `<uid>/<spot>/<file>`),
 *  plus any path a row still points at. The bucket listing is the source of
 *  truth — it finds orphans no row knows about, and it still works on a retry
 *  after the rows are gone. */
export async function userFiles(store: AccountStore, uid: string): Promise<string[]> {
  const paths = new Set<string>()
  for (const entry of await listAll(store, uid)) {
    if (entry.id !== null) { paths.add(`${uid}/${entry.name}`); continue }
    for (const f of await listAll(store, `${uid}/${entry.name}`)) {
      if (f.id !== null) paths.add(`${uid}/${entry.name}/${f.name}`)
    }
  }
  for (const p of await store.photoPaths(uid)) paths.add(p)
  return [...paths]
}

export async function purgeAccount(store: AccountStore, uid: string): Promise<PurgeReport> {
  // The uid comes from a verified session, but it is also about to become a
  // storage prefix. An empty or odd one would list somebody else's folder.
  if (!UUID_RE.test(uid)) throw new PurgeError('list', 'bad user id')

  let files: string[]
  try {
    files = await userFiles(store, uid)
  } catch (e) {
    throw new PurgeError('list', messageOf(e))
  }

  const rows: Record<string, number> = {}
  for (const { table, column } of OWNED_ROWS) {
    try {
      rows[table] = await store.deleteRows(table, column, uid)
    } catch (e) {
      throw new PurgeError('rows', `${table}: ${messageOf(e)}`)
    }
  }

  for (let i = 0; i < files.length; i += REMOVE_BATCH) {
    try {
      await store.removeFiles(files.slice(i, i + REMOVE_BATCH))
    } catch (e) {
      throw new PurgeError('files', messageOf(e))
    }
  }

  try {
    await store.deleteUser(uid)
  } catch (e) {
    throw new PurgeError('user', messageOf(e))
  }

  return { files: files.length, rows }
}

function messageOf(e: unknown): string {
  const m = (e as { message?: unknown } | null)?.message
  return typeof m === 'string' && m ? m : String(e)
}
