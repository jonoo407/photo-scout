import { useEffect, useRef, useState } from 'react'
import { IconCameraPlus, IconX } from '@tabler/icons-react'
import { useAuth } from '../../auth/useAuth'
import { listMyPhotos, uploadSpotPhoto, deleteSpotPhoto, type MyPhoto } from '../../spots/photos-api'

/* Your shots from this spot — signed-in only (they live in your account's
   storage and sync everywhere you sign in). */
export default function SpotPhotos({ spotId }: { spotId: string }) {
  const user = useAuth((s) => s.user)
  const [photos, setPhotos] = useState<MyPhoto[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [armed, setArmed] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const reload = () => listMyPhotos(spotId).then(setPhotos).catch(() => {})
  useEffect(() => {
    if (!user) return
    let alive = true
    listMyPhotos(spotId).then((p) => { if (alive) setPhotos(p) }).catch(() => {})
    return () => { alive = false }
  }, [user, spotId])

  if (!user) return null

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(false)
    try {
      await uploadSpotPhoto(spotId, file)
      await reload()
    } catch {
      setError(true)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <h3 className="h3">Your shots</h3>
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
      </div>
      {error && <p className="small" style={{ color: 'var(--skip-ink)', margin: '4px 2px 0' }}>Upload failed — photos up to 8 MB (JPEG/PNG/WebP/HEIC).</p>}
      <p className="small tertiary" style={{ margin: '4px 2px 0' }}>
        Private to your account — a personal shot log for this spot.
      </p>
    </>
  )
}
