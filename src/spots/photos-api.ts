import { getSupabase } from '../auth/supabase'

/* Your own shots on a spot (feedback #8). Files live in the public
   `spot-photos` bucket under {uid}/{spotId}/…; storage RLS ties writes to the
   first path segment, the `user_photos` table maps photos to spots
   (owner-only). Everything env-gated behind getSupabase(). */

const BUCKET = 'spot-photos'
const TABLE = 'user_photos'

export interface MyPhoto {
  id: string
  path: string
  url: string
}

export async function uploadSpotPhoto(spotId: string, file: File): Promise<void> {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('sign in to add photos')
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60)
  const path = `${user.id}/${spotId}/${Date.now()}-${safeName}`
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file)
  if (upErr) throw upErr
  const { error: rowErr } = await supabase.from(TABLE).insert({ owner: user.id, spot_id: spotId, path })
  if (rowErr) throw rowErr
}

export async function listMyPhotos(spotId: string): Promise<MyPhoto[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, path, created_at')
    .eq('spot_id', spotId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  const store = supabase.storage.from(BUCKET)
  return (data as Array<{ id: string; path: string }>).map((r) => ({
    id: r.id,
    path: r.path,
    url: store.getPublicUrl(r.path).data.publicUrl,
  }))
}

export async function deleteSpotPhoto(id: string, path: string): Promise<void> {
  const supabase = await getSupabase()
  await supabase.storage.from(BUCKET).remove([path])
  await supabase.from(TABLE).delete().eq('id', id)
}
