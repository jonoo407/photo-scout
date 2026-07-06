import { getSupabase } from '../auth/supabase'

/* User-submitted locations (feedback #9): anyone can suggest a spot — the
   row lands in `spot_suggestions` (insert-only under RLS) for periodic
   curation sessions that verify facts per docs/ADDING_SPOTS.md and promote
   the good ones into the catalog. */

export interface SuggestionInput {
  name: string
  whereHint: string
  why: string
  accessNotes: string
}

export async function submitSuggestion(input: SuggestionInput): Promise<void> {
  const name = input.name.trim()
  if (!name) throw new Error('the spot needs a name')
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('spot_suggestions').insert({
    name: name.slice(0, 120),
    where_hint: input.whereHint.trim().slice(0, 300) || null,
    why: input.why.trim().slice(0, 500) || null,
    access_notes: input.accessNotes.trim().slice(0, 500) || null,
    suggested_by: user?.id ?? null,
  })
  if (error) throw error
}
