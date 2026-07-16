import { useEffect, useRef, useState } from 'react'
import { IconCameraPlus, IconX } from '@tabler/icons-react'
import { useAuth } from '../../auth/useAuth'
import { listMyPhotos, uploadSpotPhoto, deleteSpotPhoto, type MyPhoto } from '../../spots/photos-api'
import { fetchMyPointEvents } from '../../craft/points-api'
import { pointsTotal, photoQuotaForPoints } from '../../craft/points'

/* Your shots from this spot — shared with the community and rate-able.
   Uploads are capped per spot by craft level (2 at Apprentice, up to 8 at
   Master) — the server enforces the same map; this UI just avoids the
   dead end. */
export default function SpotPhotos({ spotId }: { spotId: string }) {
  const user = useAuth((s) => s.user)
  const [photos, setPhotos] = useState<MyPhoto[]>([])
  const [quota, setQuota] = useState<number>(photoQuotaForPoints(0))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [armed, setArmed] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const reload = () => listMyPhotos(spotId).then(setPhotos).catch(() => {})
  useEffect(() => {
    if (!user) return
    let alive = true
    listMyPhotos(spotId).then((p) => { if (alive) setPhotos(p) }).catch(() => {})
    fetchMyPointEvents().then((ev) => { if (alive) setQuota(photoQuotaForPoints(pointsTotal(ev))) })
    return () => { alive = false }
  }, [user, spotId])

  if (!user) return null

  const atLimit = photos.length >= quota

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await uploadSpotPhoto(spotId, file)
      await reload()
    } catch (e) {
      setError(e instanceof Error && /photo limit/i.test(e.message)
        ? e.message
        : 'Upload failed — photos up to 8 MB (JPEG/PNG/WebP/HEIC).')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <h3 className="h3">Your shots</h3>
      <p className="small tertiary" style={{ margin: '0 2px 8px' }}>
        Shots you add are shared with the community — other photographers can see and rate them.
      </p>
      <div className="myshots">
        {photos.map((p) => (
          <div key={p.id} className="myshot">
            <img src={p.url} alt="Your shot from this spot" loading="lazy" />
            <button
              className="myshot-x"
              aria-label={armed === p.id ? 'Confirm remove' : 'Remove photo'}
              onClick={() => {
                if (armed === p.id) {
                  void deleteSpotPhoto(p.id, p.path).then(reload)
                  setArmed(null)
                } else {
                  setArmed(p.id)
                }
              }}
            >
              {armed === p.id ? 'Sure?' : <IconX size={13} />}
            </button>
          </div>
        ))}
        {!atLimit && (
          <label className="myshot-add">
            <IconCameraPlus size={20} />
            <span className="small">{busy ? 'Uploading…' : photos.length ? 'Add' : 'Add your photo'}</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              aria-label="Add your photo"
              style={{ display: 'none' }}
              disabled={busy}
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </label>
        )}
      </div>
      {error && <p className="small" style={{ color: 'var(--skip-ink)', margin: '4px 2px 0' }}>{error}</p>}
      <p className="small tertiary" style={{ margin: '4px 2px 0' }}>
        {photos.length} of {quota} shots at this spot
        {atLimit && <> — earn points to raise your limit</>}
      </p>
    </>
  )
}
