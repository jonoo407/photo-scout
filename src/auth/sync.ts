import { getSupabase } from './supabase'
import { useStore } from '../state/store'
import { applyTheme } from '../state/store'
import { mergeState, syncableSlice, type SyncedState } from './sync-merge'

/* Cross-device sync of the user's saved spots + prefs.

   Table: vantage_state (user_id uuid PK, data jsonb, updated_at) with RLS
   "own row only" — see supabase/schema.sql. Strategy: pull + merge once at
   sign-in (lists union, account scalars win), push the merged result, then
   debounce-push on every store change while signed in. */

const TABLE = 'vantage_state'
const PUSH_DEBOUNCE_MS = 2500

let unsubscribe: (() => void) | null = null
let timer: ReturnType<typeof setTimeout> | null = null

async function push(userId: string): Promise<void> {
  const supabase = await getSupabase()
  const data = syncableSlice(useStore.getState())
  await supabase.from(TABLE).upsert({ user_id: userId, data, updated_at: new Date().toISOString() })
}

/** At sign-in: fetch the account copy, merge with this device, apply + push. */
export async function pullAndMerge(userId: string): Promise<void> {
  const supabase = await getSupabase()
  const { data: row, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return // offline / table missing — stay local, retry next launch

  const merged = mergeState(syncableSlice(useStore.getState()), (row?.data as SyncedState) ?? null)
  useStore.setState(merged)
  applyTheme(merged.theme)
  await push(userId)
}

/** Debounce-push store changes while signed in. */
export function startSync(userId: string): void {
  stopSync()
  unsubscribe = useStore.subscribe(() => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { void push(userId) }, PUSH_DEBOUNCE_MS)
  })
}

export function stopSync(): void {
  if (timer) { clearTimeout(timer); timer = null }
  unsubscribe?.()
  unsubscribe = null
}
