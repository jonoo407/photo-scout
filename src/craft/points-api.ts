import { getSupabase } from '../auth/supabase'
import type { PointEvent, PointReason } from './points'

/* The point ledger lives server-side (B11): public.point_events is written
   only by validated definer RPCs (submit_hunt_stop and future award paths),
   so points can't be minted client-side. RLS scopes reads to your own rows. */

/** Your ledger, chronological — [] for guests, offline, or unconfigured env. */
export async function fetchMyPointEvents(): Promise<PointEvent[]> {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('point_events')
      .select('id, reason, pts, created_at')
      .order('created_at', { ascending: true })
    if (error || !data) return []
    return (data as Array<{ id: string; reason: PointReason; pts: number; created_at: string }>).map((r) => ({
      id: r.id,
      reason: r.reason,
      pts: r.pts,
      at: r.created_at,
    }))
  } catch {
    return []
  }
}
