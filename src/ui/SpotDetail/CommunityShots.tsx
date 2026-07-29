import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconStar, IconStarFilled, IconFlag } from '@tabler/icons-react'
import { useAuth } from '../../auth/useAuth'
import { authAvailable } from '../../auth/supabase'
import {
  fetchSpotCommunityPhotos, ratePhoto, type CommunityPhoto,
} from '../../spots/community-photos-api'
import ReportShotSheet, { type SheetOutcome } from './ReportShotSheet'

/* Community shots on a spot page (feedback 2026-07-16): everyone's shots,
   best-rated first (Bayesian score, computed server-side), star-ratable.
   Shots rated >=4.0 by >=3 photographers earn their owner +25 — minted only
   by the rate_photo RPC. Sits right after the official photos.

   Every shot that isn't yours carries a report action (V1, guideline 1.2).
   A reported shot leaves YOUR list whether or not it crossed the auto-hide
   threshold — having flagged something as offensive and then going on looking
   at it is not a reasonable thing to ask of anyone. */
export default function CommunityShots({ spotId }: { spotId: string }) {
  const nav = useNavigate()
  const user = useAuth((s) => s.user)
  const [photos, setPhotos] = useState<CommunityPhoto[]>([])
  const [nudge, setNudge] = useState<null | 'rate' | 'report'>(null)
  const [error, setError] = useState<string | null>(null)
  const [reporting, setReporting] = useState<CommunityPhoto | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = () => fetchSpotCommunityPhotos(spotId).then(setPhotos)

  useEffect(() => {
    let alive = true
    void fetchSpotCommunityPhotos(spotId).then((p) => { if (alive) setPhotos(p) })
    return () => { alive = false }
  }, [spotId, user?.id])

  const openReport = (photo: CommunityPhoto) => {
    if (!user) { setNudge('report'); return }
    setNotice(null)
    setReporting(photo)
  }

  const finishReport = (id: string, outcome: SheetOutcome) => {
    setReporting(null)
    if (outcome.kind === 'blocked') {
      setNotice("Blocked — you won't see their shots again.")
      void load() // their other shots at this spot go too, so re-read the list
      return
    }
    setPhotos((ps) => ps.filter((p) => p.id !== id))
    setNotice(outcome.hidden
      ? 'Reported — that shot is hidden while we review it.'
      : "Thanks — we'll review it. It's gone from your view either way.")
  }

  if (photos.length === 0 && !notice) return null

  const rate = async (photo: CommunityPhoto, rating: number) => {
    if (photo.isMine) return
    if (!user) { setNudge('rate'); return }
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
          <div key={p.id} className="commshot" data-testid={`commshot-${p.id}`}>
            <img src={p.url} alt={`Community shot at this spot`} loading="lazy" decoding="async" />
            {!p.isMine && (
              <button
                className="commshot-report"
                aria-label="Report this shot"
                title="Report this shot"
                onClick={() => openReport(p)}
              >
                <IconFlag size={13} />
              </button>
            )}
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
      {notice && (
        <p className="small" style={{ color: 'var(--go-ink)', margin: '6px 2px 0' }}>{notice}</p>
      )}
      {nudge && authAvailable() && (
        <p className="small muted" style={{ margin: '6px 2px 0' }}>
          Sign in to {nudge} shots —{' '}
          <button
            onClick={() => nav('/settings')}
            style={{ appearance: 'none', border: 0, background: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'var(--terracotta)', textDecoration: 'underline' }}
          >
            Settings → Account
          </button>
        </p>
      )}
      {error && <p className="small" style={{ color: 'var(--skip-ink)', margin: '6px 2px 0' }}>{error}</p>}
      {reporting && (
        <ReportShotSheet
          photoId={reporting.id}
          ownerRef={reporting.ownerRef}
          onClose={() => setReporting(null)}
          onDone={(outcome) => finishReport(reporting.id, outcome)}
        />
      )}
    </>
  )
}
