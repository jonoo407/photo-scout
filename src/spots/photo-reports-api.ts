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

/** Block whoever posted this photo. Their shots disappear from every spot
    for you, immediately and permanently, until you unblock. */
export async function blockPhotoOwner(photoId: string): Promise<BlockResult> {
  try {
    const supabase = await getSupabase()
    const { error } = await supabase.rpc('block_photo_owner', { p_photo_id: photoId })
    if (error) return { ok: false, message: error.message }
    return { ok: true }
  } catch {
    return { ok: false, message: 'Could not reach the server — try again.' }
  }
}

/** How many people you have blocked — drives the Settings row. Never throws;
    signed-out simply has nobody blocked. */
export async function fetchBlockedCount(): Promise<number> {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.rpc('blocked_count', {})
    if (error || data == null) return 0
    return Number(data)
  } catch {
    return 0
  }
}

export async function unblockEveryone(): Promise<boolean> {
  try {
    const supabase = await getSupabase()
    const { error } = await supabase.rpc('unblock_everyone', {})
    return !error
  } catch {
    return false
  }
}
