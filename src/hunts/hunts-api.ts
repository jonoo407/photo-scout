import { getSupabase } from '../auth/supabase'
import type { Hunt, HuntProgressRow } from './hunts'

/* Hunt definitions are public DB content (data-driven per city); joins and
   progress are own-row reads under RLS; a submission goes through the
   validating submit_hunt_stop() RPC — the only thing that mints points. */

interface HuntRow {
  id: string; region: string; title: string; blurb: string | null
  stops: Hunt['stops']; stop_pts: number; finish_pts: number
  opens_at: string | null; closes_at: string | null
}

export async function fetchHunts(region: string): Promise<Hunt[]> {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('hunts')
      .select('id, region, title, blurb, stops, stop_pts, finish_pts, opens_at, closes_at')
      .eq('region', region)
      .order('created_at')
    if (error || !data) return []
    return (data as HuntRow[]).map((r) => ({
      id: r.id, region: r.region, title: r.title, blurb: r.blurb,
      stops: r.stops, stopPts: r.stop_pts, finishPts: r.finish_pts,
      opensAt: r.opens_at, closesAt: r.closes_at,
    }))
  } catch {
    return []
  }
}

export async function fetchHuntById(id: string): Promise<Hunt | null> {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('hunts')
      .select('id, region, title, blurb, stops, stop_pts, finish_pts, opens_at, closes_at')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return null
    const r = data as HuntRow
    return {
      id: r.id, region: r.region, title: r.title, blurb: r.blurb,
      stops: r.stops, stopPts: r.stop_pts, finishPts: r.finish_pts,
      opensAt: r.opens_at, closesAt: r.closes_at,
    }
  } catch {
    return null
  }
}

export interface MyHuntState {
  /** Hunt ids the user joined. */
  joins: string[]
  /** All completion rows across hunts (server-written, provable). */
  progress: HuntProgressRow[]
}

export async function fetchMyHuntState(): Promise<MyHuntState> {
  try {
    const supabase = await getSupabase()
    const [joins, progress] = await Promise.all([
      supabase.from('hunt_joins').select('hunt_id').order('created_at'),
      supabase.from('hunt_progress').select('hunt_id, stop_index, photo_path, created_at').order('created_at'),
    ])
    return {
      joins: ((joins.data ?? []) as Array<{ hunt_id: string }>).map((r) => r.hunt_id),
      progress: ((progress.data ?? []) as Array<{ hunt_id: string; stop_index: number; photo_path: string; created_at: string }>)
        .map((r) => ({ huntId: r.hunt_id, stopIndex: r.stop_index, photoPath: r.photo_path, createdAt: r.created_at })),
    }
  } catch {
    return { joins: [], progress: [] }
  }
}

export async function joinHunt(huntId: string): Promise<boolean> {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { error } = await supabase.from('hunt_joins').upsert({ owner: user.id, hunt_id: huntId })
    return !error
  } catch {
    return false
  }
}

export type SubmitResult =
  | { ok: true; done: number; total: number; finished: boolean; awarded: number; totalPts: number }
  | { ok: false; message: string }

export async function submitHuntStop(args: {
  huntId: string; stopIndex: number; photoPath: string; lat: number; lng: number
}): Promise<SubmitResult> {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.rpc('submit_hunt_stop', {
      p_hunt_id: args.huntId,
      p_stop_index: args.stopIndex,
      p_photo_path: args.photoPath,
      p_lat: args.lat,
      p_lng: args.lng,
    })
    if (error) return { ok: false, message: error.message }
    const r = data as { done: number; total: number; finished: boolean; awarded: number; totalPts: number }
    return { ok: true, ...r }
  } catch {
    return { ok: false, message: 'Could not reach the server — check your connection and try again.' }
  }
}
