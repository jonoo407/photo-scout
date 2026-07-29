import { getSupabase } from '../auth/supabase'

/* Photo reporting + user blocking (V1, 2026-07-28).

   Community shots became public content on 2026-07-16 with no way to report
   one and no way to mute the person who posted it. App Review guideline 1.2
   requires both for user-generated content, alongside a filter on posting and
   published contact info.

   Both paths are definer RPCs rather than table writes for one reason: the
   listing RPC reduces a photo's owner to two initials, so the client has no
   owner uuid to block. Blocking is therefore keyed off the PHOTO, and the
   server resolves the owner. The same applies to auto-hiding — a report count
   the client could write is a report count an abuser can forge. */

export type ReportReason = 'offensive' | 'harassment' | 'copyright' | 'spam' | 'other'

export const REPORT_REASONS: ReadonlyArray<{ id: ReportReason; label: string; hint: string }> = [
  { id: 'offensive', label: 'Offensive or explicit', hint: 'Nudity, gore, hate' },
  { id: 'harassment', label: 'Harassment or bullying', hint: 'Targets a person' },
  { id: 'copyright', label: 'Not their photo', hint: 'Copied from someone else' },
  { id: 'spam', label: 'Spam or off-topic', hint: 'Not a shot of this spot' },
  { id: 'other', label: 'Something else', hint: 'Tell us below' },
]

const MAX_NOTE = 1000

export type ReportResult =
  | { ok: true; hidden: boolean }
  | { ok: false; message: string }

/** File a report. Resolves with `hidden: true` when this report tipped the
    shot over the auto-hide threshold, so the UI can say so plainly. */
export async function reportPhoto(
  photoId: string,
  reason: ReportReason,
  note?: string,
): Promise<ReportResult> {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.rpc('report_photo', {
      p_photo_id: photoId,
      p_reason: reason,
      p_note: note?.trim().slice(0, MAX_NOTE) || null,
    })
    if (error) return { ok: false, message: error.message }
    return { ok: true, hidden: Boolean((data as { hidden?: boolean } | null)?.hidden) }
  } catch {
    return { ok: false, message: 'Could not reach the server — try again.' }
  }
}

export type BlockResult = { ok: true } | { ok: false; message: string }

/* Blocking is keyed off an opaque per-photographer `ref` (added 2026-07-29),
   not an auth uuid and no longer a photo id.

   The uuid stays server-side on purpose: it is a stable handle, and with one
   you could enumerate photos and map where a given photographer shoots — a
   real exposure for an app about going to real places. The ref is random, so
   it reveals nothing and reverses to nothing, but it IS stable per person,
   which is what lets the app group someone's shots and, more importantly, show
   a block list you can undo one row at a time. Blocking by photo (what V1
   shipped) could not do that, and had no answer at all for surfaces with no
   photo attached — discussion threads and critiques, both on the backlog. */

/** Block a photographer by their opaque ref. Their shots disappear from every
    spot for you, immediately, until you unblock. */
export async function blockPhotographer(ref: string): Promise<BlockResult> {
  try {
    const supabase = await getSupabase()
    const { error } = await supabase.rpc('block_photographer', { p_ref: ref })
    if (error) return { ok: false, message: error.message }
    return { ok: true }
  } catch {
    return { ok: false, message: 'Could not reach the server — try again.' }
  }
}

/** Lift a single block, leaving the rest alone. */
export async function unblockPhotographer(ref: string): Promise<BlockResult> {
  try {
    const supabase = await getSupabase()
    const { error } = await supabase.rpc('unblock_photographer', { p_ref: ref })
    if (error) return { ok: false, message: error.message }
    return { ok: true }
  } catch {
    return { ok: false, message: 'Could not reach the server — try again.' }
  }
}

export interface BlockedPhotographer {
  ref: string
  /** The same two initials shown on a shot — enough to recognise a row. */
  initials: string
  blockedAt: string
}

/** Who you have blocked. Never throws; signed-out simply has nobody blocked. */
export async function fetchBlockedPhotographers(): Promise<BlockedPhotographer[]> {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.rpc('blocked_photographers', {})
    if (error || !data) return []
    return (data as Array<{ ref: string; initials: string; blocked_at: string }>).map((r) => ({
      ref: r.ref, initials: r.initials, blockedAt: r.blocked_at,
    }))
  } catch {
    return []
  }
}

/* `unblockEveryone` was removed on 2026-07-29. It only ever existed because
   the block list could not be shown, so "all or nothing" was the only undo the
   client could offer. Per-row unblock replaced it. The `unblock_everyone()`
   RPC is left in the database, unused, rather than spending a migration. */
