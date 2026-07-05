import { getSupabase } from '../auth/supabase'
import { useStore } from '../state/store'
import { hasNewResponses, type ListSpot } from './shortlist'

/* Stored client shortlists (v2) — Supabase tables `shortlists` and
   `shortlist_responses` (see supabase/schema.sql). The photographer owns lists
   under RLS; the client (no account) reads one via the get_shortlist RPC —
   knowing the unguessable uuid IS the authorization — and writes a response
   with a plain insert. Everything here is env-gated behind getSupabase(). */

const LISTS = 'shortlists'
const RESPONSES = 'shortlist_responses'

export type { ListSpot }

export interface SharedShortlist {
  title: string | null
  spots: ListSpot[]
}

export interface ClientResponse {
  id: string
  picked: string[]
  clientName: string | null
  comment: string | null
  createdAt: string
}

export interface MyShortlist {
  id: string
  title: string | null
  spots: ListSpot[]
  createdAt: string
  responses: ClientResponse[]
}

/** Defensive read of the spots jsonb — a hand-edited row can't crash the page. */
function toListSpots(raw: unknown): ListSpot[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((x) => {
    if (!x || typeof x !== 'object' || typeof (x as ListSpot).id !== 'string') return []
    const note = (x as ListSpot).note
    return [typeof note === 'string' && note ? { id: (x as ListSpot).id, note } : { id: (x as ListSpot).id }]
  })
}

export async function createShortlist(title: string | null, spots: ListSpot[]): Promise<string> {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('sign in to send client lists')
  const { data, error } = await supabase
    .from(LISTS)
    .insert({ owner: user.id, title, spots })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('could not create the list')
  return data.id as string
}

export async function fetchSharedShortlist(id: string): Promise<SharedShortlist | null> {
  const supabase = await getSupabase()
  const { data, error } = await supabase.rpc('get_shortlist', { p_id: id })
  if (error) throw error
  const row = (Array.isArray(data) ? data[0] : data) as { title?: string | null; spots?: unknown } | undefined
  if (!row) return null
  return { title: row.title ?? null, spots: toListSpots(row.spots) }
}

export async function submitShortlistResponse(
  listId: string,
  r: { picked: string[]; clientName?: string; comment?: string },
): Promise<void> {
  const supabase = await getSupabase()
  const { error } = await supabase.from(RESPONSES).insert({
    list_id: listId,
    picked: r.picked,
    client_name: r.clientName?.trim() || null,
    comment: r.comment?.trim() || null,
  })
  if (error) throw error
}

export async function fetchMyShortlists(): Promise<MyShortlist[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from(LISTS)
    .select(`id,title,spots,created_at,${RESPONSES}(id,picked,client_name,comment,created_at)`)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  type Row = {
    id: string; title: string | null; spots: unknown; created_at: string
    shortlist_responses?: Array<{ id: string; picked: unknown; client_name: string | null; comment: string | null; created_at: string }>
  }
  return (data as Row[]).map((row) => ({
    id: row.id,
    title: row.title ?? null,
    spots: toListSpots(row.spots),
    createdAt: row.created_at,
    responses: (row.shortlist_responses ?? []).map((r) => ({
      id: r.id,
      picked: Array.isArray(r.picked) ? (r.picked as string[]) : [],
      clientName: r.client_name ?? null,
      comment: r.comment ?? null,
      createdAt: r.created_at,
    })),
  }))
}

export async function deleteShortlist(id: string): Promise<void> {
  const supabase = await getSupabase()
  const { error } = await supabase.from(LISTS).delete().eq('id', id)
  if (error) throw error
}

/** App-open check: light the Saved-tab dot when a client responded since the
 *  photographer last looked. Quiet no-op when offline or signed out. */
export async function refreshResponsesBadge(): Promise<void> {
  try {
    const lists = await fetchMyShortlists()
    const seen = useStore.getState().listsSeenAt
    useStore.setState({ newClientResponse: hasNewResponses(lists, seen) })
  } catch {
    // offline / not signed in / table missing — leave the dot as-is
  }
}
