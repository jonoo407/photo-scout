import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconChevronLeft, IconCamera } from '@tabler/icons-react'
import { useAuth } from '../../auth/useAuth'
import { useSpotsByIds } from '../../state/useRegion'
import { listAllMyPhotos, type MyPhotoAll } from '../../spots/photos-api'

/* Every shot you've uploaded, grouped by spot (the You-tab "Your shots" row).
   Tapping a group heading jumps to the spot page where shots are managed. */
export default function YourShotsScreen() {
  const nav = useNavigate()
  const user = useAuth((s) => s.user)
  const [photos, setPhotos] = useState<MyPhotoAll[] | null>(null)

  useEffect(() => {
    if (!user) { setPhotos(null); return }
    let alive = true
    listAllMyPhotos().then((p) => { if (alive) setPhotos(p) })
    return () => { alive = false }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const bySpot = new Map<string, MyPhotoAll[]>()
    for (const p of photos ?? []) {
      bySpot.set(p.spotId, [...(bySpot.get(p.spotId) ?? []), p])
    }
    return [...bySpot.entries()] // insertion order = newest spot first
  }, [photos])
  const { byId } = useSpotsByIds(groups.map(([id]) => id))

  return (
    <div className="screen">
      <button className="back" onClick={() => nav(-1)}><IconChevronLeft size={16} /> Back</button>
      <h1>Your shots</h1>

      {!user ? (
        <div className="empty">
          <IconCamera size={30} />
          <p className="et">Sign in to keep shots</p>
          <p className="es">Your uploads live in your account and follow you across devices — sign in from Settings → Account.</p>
        </div>
      ) : photos === null ? (
        <p className="center-note">Loading…</p>
      ) : photos.length === 0 ? (
        <div className="empty">
          <IconCamera size={30} />
          <p className="et">No shots yet</p>
          <p className="es">On any spot page, add your photo under <strong>Your shots</strong> — everything you upload collects here.</p>
        </div>
      ) : (
        <>
          <p className="small tertiary" style={{ margin: '0 2px 12px' }}>
            {photos.length} {photos.length === 1 ? 'shot' : 'shots'} across {groups.length} {groups.length === 1 ? 'spot' : 'spots'}
          </p>
          {groups.map(([spotId, shots]) => (
            <section key={spotId} style={{ marginBottom: 16 }}>
              <button
                className="parklink"
                style={{ marginBottom: 8 }}
                onClick={() => nav(`/spot/${spotId}`)}
              >
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15 }}>{byId.get(spotId)?.name ?? spotId}</span>
                <IconChevronLeft size={14} style={{ transform: 'rotate(180deg)' }} />
              </button>
              <div className="myshots">
                {shots.map((p) => (
                  <span key={p.id} className="myshot">
                    <img src={p.url} alt={`Your shot at ${byId.get(spotId)?.name ?? spotId}`} loading="lazy" />
                  </span>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}
