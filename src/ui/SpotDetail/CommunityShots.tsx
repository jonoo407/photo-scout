import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { useAuth } from '../../auth/useAuth'
import { authAvailable } from '../../auth/supabase'
import {
  fetchSpotCommunityPhotos, ratePhoto, type CommunityPhoto,
} from '../../spots/community-photos-api'

/* Community shots on a spot page (feedback 2026-07-16): everyone's shots,
   best-rated first (Bayesian score, computed server-side), star-ratable.
   Shots rated >=4.0 by >=3 photographers earn their owner +25 — minted only
   by the rate_photo RPC. Sits right after the official photos. */
export default function CommunityShots({ spotId }: { spotId: string }) {
  const nav = useNavigate()
  const user = useAuth((s) => s.user)
  const [photos, setPhotos] = useState<CommunityPhoto[]>([])
  const [nudge, setNudge] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void fetchSpotCommunityPhotos(spotId).then((p) => { if (alive) setPhotos(p) })
    return () => { alive = false }
  }, [spotId, user?.id])

  if (photos.length === 0) return null

  const rate = async (photo: CommunityPhoto, rating: number) => {
    if (photo.isMine) return
    if (!user) { setNudge(true); return }
    setError(null)
    const prev = photos
    setPhotos((ps) => ps.map((p) => (p.id === photo.id ? { ...p, myRating: rating } : p)))
    const res = await ratePhoto(photo.id, rating)
    if (!res.ok) {
      setPhotos(prev)
      setError(res.message)
      return
    }
    setPhotos((ps) => ps.map((p) =>
      p.id === photo.id ? { ...p, ratingsCount: res.count, avgRating: res.avg } : p))
  }

  return (
    <>
      <h3 className="h3">Community shots</h3>
      <div className="commshots">
        {photos.map((p) => (
          <div key={p.id} className="commshot">
            <img src={p.url} alt={`Community shot at this spot`} loading="lazy" decoding="async" />
            <div className="commshot-stars" role="group" aria-label="Rate this shot">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  disabled={p.isMine}
                  onClick={() => void rate(p, star)}
                >
                  {(p.myRating ?? 0) >= star
                    ? <IconStarFilled size={15} color="var(--amber)" />
                    : <IconStar size={15} color={p.isMine ? 'var(--line-strong)' : 'var(--ink-3)'} />}
                </button>
              ))}
            </div>
            <p className="small tertiary commshot-meta">
              {p.ratingsCount > 0
                ? <>{p.avgRating.toFixed(1)} ★ · {p.ratingsCount} rating{p.ratingsCount === 1 ? '' : 's'}</>
                : 'No ratings yet'}
              {p.isMine
                ? <span className="pill maybe" style={{ marginLeft: 6 }}>your shot</span>
                : <span className="commshot-owner">{p.ownerInitials}</span>}
            </p>
          </div>
        ))}
      </div>
      {nudge && authAvailable() && (
        <p className="small muted" style={{ margin: '6px 2px 0' }}>
          Sign in to rate shots —{' '}
          <button
            onClick={() => nav('/settings')}
            style={{ appearance: 'none', border: 0, background: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'var(--terracotta)', textDecoration: 'underline' }}
          >
            Settings → Account
          </button>
        </p>
      )}
      {error && <p className="small" style={{ color: 'var(--skip-ink)', margin: '6px 2px 0' }}>{error}</p>}
    </>
  )
}
