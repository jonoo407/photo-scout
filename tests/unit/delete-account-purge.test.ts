import { describe, it, expect } from 'vitest'
import {
  purgeAccount, userFiles, bearerToken, PurgeError, OWNED_ROWS, LIST_PAGE, REMOVE_BATCH,
  type AccountStore, type ListedObject,
} from '../../supabase/functions/delete-account/purge'

/* The Edge Function half of account deletion (App Store 5.1.1(v)).
 *
 * What must hold:
 *   · every file under the user's folder goes, including ones no row knows
 *     about, and nothing outside it is ever listed,
 *   · well-rated photos go too — prune_departing_photos would keep them
 *     anonymized, which is not what "delete my data" means,
 *   · the auth user is deleted LAST, so a failure anywhere earlier leaves an
 *     account the person can sign into and retry from.
 */

const UID = '11111111-2222-4333-8444-555555555555'

type Call = [string, ...unknown[]]

/** An in-memory bucket + tables that records every call in order. */
function fakeStore(opts: {
  bucket?: Record<string, ListedObject[]>
  rowPaths?: string[]
  rowCounts?: Record<string, number>
  fail?: Partial<Record<'list' | 'photoPaths' | 'deleteRows' | 'removeFiles' | 'deleteUser', string>>
} = {}) {
  const calls: Call[] = []
  const store: AccountStore = {
    async list(prefix, offset, limit) {
      calls.push(['list', prefix, offset, limit])
      if (opts.fail?.list) throw new Error(opts.fail.list)
      return (opts.bucket?.[prefix] ?? []).slice(offset, offset + limit)
    },
    async photoPaths(uid) {
      calls.push(['photoPaths', uid])
      if (opts.fail?.photoPaths) throw new Error(opts.fail.photoPaths)
      return opts.rowPaths ?? []
    },
    async deleteRows(table, column, uid) {
      calls.push(['deleteRows', table, column, uid])
      if (opts.fail?.deleteRows === table) throw new Error('rls says no')
      return opts.rowCounts?.[table] ?? 0
    },
    async removeFiles(paths) {
      calls.push(['removeFiles', paths])
      if (opts.fail?.removeFiles) throw new Error(opts.fail.removeFiles)
    },
    async deleteUser(uid) {
      calls.push(['deleteUser', uid])
      if (opts.fail?.deleteUser) throw new Error(opts.fail.deleteUser)
    },
  }
  return { store, calls }
}

const folder = (name: string): ListedObject => ({ name, id: null })
const file = (name: string): ListedObject => ({ name, id: `id-${name}` })

describe('bearerToken', () => {
  it('reads the token out of an Authorization header', () => {
    expect(bearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi')
    expect(bearerToken('bearer  abc')).toBe('abc')
  })

  it('refuses anything that is not a single bearer token', () => {
    for (const h of [null, undefined, '', 'Bearer', 'Bearer ', 'Basic abc', 'abc', 'Bearer a b']) {
      expect(bearerToken(h), String(h)).toBeNull()
    }
  })
})

describe('userFiles — finding everything the user uploaded', () => {
  it('walks <uid>/<spot>/<file> and returns full paths', async () => {
    const { store } = fakeStore({
      bucket: {
        [UID]: [folder('bayshore-boulevard'), folder('elfreths-alley')],
        [`${UID}/bayshore-boulevard`]: [file('1-a.jpg'), file('2-b.jpg')],
        [`${UID}/elfreths-alley`]: [file('3-c.jpg')],
      },
    })
    expect((await userFiles(store, UID)).sort()).toEqual([
      `${UID}/bayshore-boulevard/1-a.jpg`,
      `${UID}/bayshore-boulevard/2-b.jpg`,
      `${UID}/elfreths-alley/3-c.jpg`,
    ])
  })

  it('includes a stray file at the folder root', async () => {
    const { store } = fakeStore({ bucket: { [UID]: [file('stray.jpg')] } })
    expect(await userFiles(store, UID)).toEqual([`${UID}/stray.jpg`])
  })

  it('pages through large folders instead of stopping at the first page', async () => {
    const many = Array.from({ length: LIST_PAGE * 2 + 3 }, (_, i) => file(`${i}.jpg`))
    const { store, calls } = fakeStore({ bucket: { [UID]: [folder('s')], [`${UID}/s`]: many } })
    expect(await userFiles(store, UID)).toHaveLength(LIST_PAGE * 2 + 3)
    expect(calls.filter((c) => c[0] === 'list' && c[1] === `${UID}/s`)).toHaveLength(3)
  })

  it('adds paths rows point at, even if the listing missed them, without duplicates', async () => {
    const { store } = fakeStore({
      bucket: { [UID]: [folder('s')], [`${UID}/s`]: [file('a.jpg')] },
      rowPaths: [`${UID}/s/a.jpg`, `${UID}/t/b.jpg`],
    })
    expect((await userFiles(store, UID)).sort()).toEqual([`${UID}/s/a.jpg`, `${UID}/t/b.jpg`])
  })

  it('only ever lists inside the user\'s own folder', async () => {
    const { store, calls } = fakeStore({
      bucket: { [UID]: [folder('s')], [`${UID}/s`]: [file('a.jpg')] },
    })
    await userFiles(store, UID)
    for (const c of calls.filter((c) => c[0] === 'list')) {
      expect(String(c[1]) === UID || String(c[1]).startsWith(`${UID}/`)).toBe(true)
    }
  })
})

describe('purgeAccount', () => {
  const populated = () => fakeStore({
    bucket: { [UID]: [folder('s')], [`${UID}/s`]: [file('a.jpg'), file('b.jpg')] },
    rowPaths: [`${UID}/s/a.jpg`],
    rowCounts: { user_photos: 1, feedback: 2, spot_suggestions: 0 },
  })

  it('deletes rows, then files, then the auth user — in that order', async () => {
    const { store, calls } = populated()
    const report = await purgeAccount(store, UID)

    const order = calls.map((c) => c[0]).filter((k) => k !== 'list' && k !== 'photoPaths')
    expect(order).toEqual([...OWNED_ROWS.map(() => 'deleteRows'), 'removeFiles', 'deleteUser'])
    expect(calls.at(-1)).toEqual(['deleteUser', UID])
    expect(report).toEqual({ files: 2, rows: { user_photos: 1, feedback: 2, spot_suggestions: 0 } })
  })

  it('removes every photo row, not just the ones the prune trigger would', async () => {
    const { store, calls } = populated()
    await purgeAccount(store, UID)
    expect(calls).toContainEqual(['deleteRows', 'user_photos', 'owner', UID])
  })

  it('removes feedback and suggestions rather than leaving them set-null', async () => {
    const { store, calls } = populated()
    await purgeAccount(store, UID)
    expect(calls).toContainEqual(['deleteRows', 'feedback', 'submitted_by', UID])
    expect(calls).toContainEqual(['deleteRows', 'spot_suggestions', 'suggested_by', UID])
  })

  it('batches file removal', async () => {
    const many = Array.from({ length: REMOVE_BATCH + 5 }, (_, i) => file(`${i}.jpg`))
    const { store, calls } = fakeStore({ bucket: { [UID]: [folder('s')], [`${UID}/s`]: many } })
    await purgeAccount(store, UID)
    const batches = calls.filter((c) => c[0] === 'removeFiles').map((c) => (c[1] as string[]).length)
    expect(batches).toEqual([REMOVE_BATCH, 5])
  })

  it('skips the Storage call entirely for someone who never uploaded', async () => {
    const { store, calls } = fakeStore()
    const report = await purgeAccount(store, UID)
    expect(calls.some((c) => c[0] === 'removeFiles')).toBe(false)
    expect(report.files).toBe(0)
    expect(calls.at(-1)).toEqual(['deleteUser', UID])
  })

  it.each([
    ['list', { list: 'storage down' }],
    ['rows', { deleteRows: 'feedback' }],
    ['files', { removeFiles: 'storage down' }],
  ] as const)('keeps the account when the %s step fails, so the person can retry', async (step, fail) => {
    const { store, calls } = fakeStore({
      bucket: { [UID]: [folder('s')], [`${UID}/s`]: [file('a.jpg')] },
      fail,
    })
    const err = await purgeAccount(store, UID).catch((e) => e)
    expect(err).toBeInstanceOf(PurgeError)
    expect((err as PurgeError).step).toBe(step)
    expect(calls.some((c) => c[0] === 'deleteUser')).toBe(false)
  })

  it('reports a failed auth-user delete as the user step', async () => {
    const { store } = fakeStore({ fail: { deleteUser: 'Database error deleting user' } })
    const err = (await purgeAccount(store, UID).catch((e) => e)) as PurgeError
    expect(err.step).toBe('user')
    expect(err.message).toMatch(/database error/i)
  })

  it('refuses a user id that is not a uuid before touching anything', async () => {
    for (const bad of ['', '..', 'someone-else', `${UID}/..`]) {
      const { store, calls } = fakeStore()
      await expect(purgeAccount(store, bad)).rejects.toBeInstanceOf(PurgeError)
      expect(calls).toEqual([])
    }
  })
})
