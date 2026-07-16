import { getSupabase } from '../auth/supabase'

/* Community shots (social feature, 2026-07-16). Listing rides the
   spot_community_photos definer RPC — score-sorted server-side, owners
   reduced to two initials. Rating goes through rate_photo, the only thing
   that can mint topShot points. */

const BUCKET = 'spot-photos'

export interface CommunityPhoto {
  id: string
  url: string
  ownerInitials: string
  isMine: boolean
  ratingsCount: number
  avgRating: number
  score: number
  myRating: number | null
}

interface Row {
  id: string; path: string; owner_initials: string; is_mine: boolean
  ratings_count: number; avg_rating: number; score: number
  my_rating: number | null; created_at: string
}

export async function fetchSpotCommunityPhotos(spotId: string): Promise<CommunityPhoto[]> {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.rpc('spot_community_photos', { p_spot_id: spotId })
    if (error || !data) return []
    const store = supabase.storage.from(BUCKET)
    return (data as Row[]).map((r) => ({
      id: r.id,
      url: store.getPublicUrl(r.path).data.publicUrl,
      ownerInitials: r.owner_initials,
      isMine: r.is_mine,
      ratingsCount: Number(r.ratings_count),
      avgRating: Number(r.avg_rating),
      score: Number(r.score),
      myRating: r.my_rating == null ? null : Number(r.my_rating),
    }))
  } catch {
    return []
  }
}

export type RateResult = { ok: true; count: number; avg: number } | { ok: false; message: string }

export async function ratePhoto(photoId: string, rating: number): Promise<RateResult> {
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.rpc('rate_photo', { p_photo_id: photoId, p_rating: rating })
    if (error) return { ok: false, message: error.message }
    const r = data as { count: number; avg: number }
    return { ok: true, count: Number(r.count), avg: Number(r.avg) }
  } catch {
    return { ok: false, message: 'Could not reach the server — try again.' }
  }
}
