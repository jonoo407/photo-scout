import { IconStar, IconCircleCheck, IconCamera } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { useAllSpots } from '../../state/useRegion'
import { SpotCard } from '../SpotCard'
import type { Spot } from '../../spots/types'

/* The user's own map of the app: want-to-go, been-there, and shot progress.
   Spans every city (saved spots keep working when you switch regions). */
export default function SavedScreen() {
  const wishlist = useStore((s) => s.wishlist)
  const visited = useStore((s) => s.visited)
  const checklist = useStore((s) => s.checklist)
  const { spots, loading } = useAllSpots()

  const byId = new Map(spots.map((s) => [s.id, s]))
  const want = wishlist.map((id) => byId.get(id)).filter(Boolean) as Spot[]
  const been = visited.map((id) => byId.get(id)).filter(Boolean) as Spot[]

  const shotMeta = (spot: Spot) => {
    const total = spot.craft.signatureShots.length
    const done = (checklist[spot.id] ?? []).filter((id) => spot.craft.signatureShots.some((s) => s.id === id)).length
    return total ? (
      <span style={done === total ? { color: 'var(--go-ink)' } : undefined}>
        <IconCamera size={14} /> {done}/{total} shots
      </span>
    ) : undefined
  }

  const empty = !loading && want.length === 0 && been.length === 0

  return (
    <div className="screen">
      <h1>Saved</h1>

      {empty && (
        <div className="empty">
          <IconStar size={30} />
          <p className="et">Nothing saved yet</p>
          <p className="es">
            On any spot, tap <strong>Want to go</strong> to build your shortlist or{' '}
            <strong>Been there</strong> to track it — everything lands here (and syncs when you're signed in).
          </p>
        </div>
      )}

      {want.length > 0 && (
        <>
          <p className="bucket"><IconStar size={15} color="var(--maybe-ink)" /> Want to go</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {want.map((s) => (
              <SpotCard key={s.id} spot={s} reason={`${s.city}`} meta={shotMeta(s)} />
            ))}
          </div>
        </>
      )}

      {been.length > 0 && (
        <>
          <p className="bucket"><IconCircleCheck size={15} color="var(--go-ink)" /> Been there</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {been.map((s) => (
              <SpotCard key={s.id} spot={s} reason={`${s.city}`} meta={shotMeta(s)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
