import { getSupabase } from '../auth/supabase'

/* Next-city scoreboard (B12). The raw city_votes table has no anon read
   (it maps users to votes) — public tallies come from the counts-only
   city_vote_totals() definer function; your own row is RLS-readable. */

/** Live tallies by city id — null when unreachable (offline / not deployed),
    so the UI can say "unavailable" instead of showing false zeros. */
export async function fetchVoteTotals(): Promise<Record<string, number> | null> {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.rpc('city_vote_totals')
    if (error || !data) return null
    const totals: Record<string, number> = {}
    for (const row of data as Array<{ city: string; votes: number }>) totals[row.city] = Number(row.votes)
    return totals
  } catch {
    return null
  }
}

/** The signed-in user's current vote (city id), if any. */
export async function fetchMyVote(): Promise<string | null> {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.from('city_votes').select('city').maybeSingle()
    if (error) return null
    return (data as { city: string } | null)?.city ?? null
  } catch {
    return null
  }
}

/** Cast (or change) the vote — one per account, upsert on the PK. */
export async function castVote(city: string): Promise<boolean> {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { error } = await supabase.from('city_votes').upsert({ user_id: user.id, city })
    return !error
  } catch {
    return false
  }
}
