import { describe, it, expect } from 'vitest'
import {
  selectOrphans, DEFAULT_GRACE_HOURS, DEFAULT_MAX_DELETES, type StorageObject,
} from '../../supabase/functions/storage-janitor/select'

/* Backlog V10. Deleting an account cascades its `user_photos` ROWS, but the
 * FILES stay in the bucket forever: Supabase blocks SQL deletes on
 * storage.objects (Storage API only) and the departing owner's token is gone,
 * so nothing client-side can ever reach them. A service-role janitor is the
 * only thing that can.
 *
 * This is the selection half, and it is the half worth testing hardest,
 * because the failure mode is deleting a photograph somebody still owns. The
 * rules it must never break:
 *   · a file WITH a row is never touched, whoever owns it,
 *   · a just-uploaded file is never touched, because the row insert may still
 *     be in flight (or may have failed, and the client compensates),
 *   · one run can never delete more than a bounded number of files.
 */

const hoursAgo = (now: Date, h: number) =>
  new Date(now.getTime() - h * 3600_000).toISOString()

const NOW = new Date('2026-09-12T12:00:00Z')

function obj(name: string, ageHours: number): StorageObject {
  return { name, created_at: hoursAgo(NOW, ageHours) }
}

describe('storage janitor — choosing what to delete', () => {
  it('deletes a file whose row is gone', () => {
    const orphans = selectOrphans({
      objects: [obj('uid/spot/old-orphan.jpg', 100)],
      knownPaths: new Set<string>(),
      now: NOW,
    })
    expect(orphans).toEqual(['uid/spot/old-orphan.jpg'])
  })

  it('never touches a file that still has a row', () => {
    const orphans = selectOrphans({
      objects: [obj('uid/spot/kept.jpg', 1000)],
      knownPaths: new Set(['uid/spot/kept.jpg']),
      now: NOW,
    })
    expect(orphans).toEqual([])
  })

  it('never touches a file that still has a row after the owner was anonymized', () => {
    // Account deletion KEEPS good photos with owner = null. Their rows still
    // carry the path, so the path set is the right test, not ownership.
    const orphans = selectOrphans({
      objects: [obj('departed-uid/spot/good-shot.jpg', 5000)],
      knownPaths: new Set(['departed-uid/spot/good-shot.jpg']),
      now: NOW,
    })
    expect(orphans).toEqual([])
  })

  it('spares a just-uploaded file — the row insert may still be in flight', () => {
    const orphans = selectOrphans({
      objects: [obj('uid/spot/uploading-right-now.jpg', 0.05)],
      knownPaths: new Set<string>(),
      now: NOW,
    })
    expect(orphans).toEqual([])
  })

  it('holds the grace period for a full day, not minutes', () => {
    expect(DEFAULT_GRACE_HOURS).toBeGreaterThanOrEqual(24)
    const justInside = selectOrphans({
      objects: [obj('uid/s/a.jpg', DEFAULT_GRACE_HOURS - 0.5)],
      knownPaths: new Set<string>(), now: NOW,
    })
    expect(justInside).toEqual([])
    const justOutside = selectOrphans({
      objects: [obj('uid/s/a.jpg', DEFAULT_GRACE_HOURS + 0.5)],
      knownPaths: new Set<string>(), now: NOW,
    })
    expect(justOutside).toEqual(['uid/s/a.jpg'])
  })

  it('caps the blast radius of a single run', () => {
    const many = Array.from({ length: DEFAULT_MAX_DELETES + 50 }, (_, i) => obj(`uid/s/${i}.jpg`, 500))
    const orphans = selectOrphans({ objects: many, knownPaths: new Set<string>(), now: NOW })
    expect(orphans.length).toBe(DEFAULT_MAX_DELETES)
  })

  it('refuses an object with no usable timestamp rather than guessing it is old', () => {
    const orphans = selectOrphans({
      objects: [{ name: 'uid/s/undated.jpg', created_at: null }, { name: 'uid/s/junk.jpg', created_at: 'nonsense' }],
      knownPaths: new Set<string>(), now: NOW,
    })
    expect(orphans).toEqual([])
  })

  it('ignores directory placeholders rather than trying to delete them', () => {
    const orphans = selectOrphans({
      objects: [obj('.emptyFolderPlaceholder', 900), obj('uid/.emptyFolderPlaceholder', 900)],
      knownPaths: new Set<string>(), now: NOW,
    })
    expect(orphans).toEqual([])
  })

  it('picks only the orphans out of a mixed bucket', () => {
    const orphans = selectOrphans({
      objects: [
        obj('a/keep.jpg', 900),
        obj('b/orphan.jpg', 900),
        obj('c/too-new.jpg', 1),
        obj('d/orphan2.jpg', 900),
      ],
      knownPaths: new Set(['a/keep.jpg']),
      now: NOW,
    })
    expect(orphans.sort()).toEqual(['b/orphan.jpg', 'd/orphan2.jpg'])
  })
})
