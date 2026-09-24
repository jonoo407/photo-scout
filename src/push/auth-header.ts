import { authAvailable, getSupabase } from '../auth/supabase'

/* The Worker binds a push subscription to whoever the access token says, never
   to an id in the request body, so /api/push/subscribe needs the session. */
export async function pushAuthHeaders(): Promise<Record<string, string>> {
  if (!authAvailable()) return {}
  try {
    const { data } = await (await getSupabase()).auth.getSession()
    const token = data.session?.access_token
    return token ? { authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}
