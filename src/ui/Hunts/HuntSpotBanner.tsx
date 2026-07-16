import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCamera, IconChevronRight } from '@tabler/icons-react'
import { useAuth } from '../../auth/useAuth'
import { useRegion } from '../../state/useRegion'
import { fetchHunts, fetchMyHuntState, type MyHuntState } from '../../hunts/hunts-api'
import { huntStatus, isOpen, type Hunt } from '../../hunts/hunts'

/* The hunt-stop banner on spot pages (handoff 2f) — spots that are hunt
   stops advertise the hunt, and switch to progress copy once you're in. */
export default function HuntSpotBanner({ spotId }: { spotId: string }) {
  const nav = useNavigate()
  const user = useAuth((s) => s.user)
  const region = useRegion()
  const [hunts, setHunts] = useState<Hunt[]>([])
  const [mine, setMine] = useState<MyHuntState>({ joins: [], progress: [] })
  const now = useMemo(() => new Date(), [])

  useEffect(() => {
    let alive = true
    void fetchHunts(region.id).then((h) => { if (alive) setHunts(h) })
    return () => { alive = false }
  }, [region.id])
  useEffect(() => {
    if (!user) { setMine({ joins: [], progress: [] }); return }
    let alive = true
    void fetchMyHuntState().then((s) => { if (alive) setMine(s) })
    return () => { alive = false }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const hunt = hunts.find((h) => isOpen(h, now) && h.stops.some((s) => s.spotId === spotId))
  if (!hunt) return null
  const stopIdx = hunt.stops.findIndex((s) => s.spotId === spotId)
  const joined = mine.joins.includes(hunt.id)
  const status = huntStatus(hunt, mine.progress.filter((p) => p.huntId === hunt.id))

  return (
    <button className="alert" style={{ border: 0, cursor: 'pointer', width: '100%' }} onClick={() => nav(`/hunts/${hunt.id}`)}>
      <IconCamera size={20} style={{ flex: 'none' }} />
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p className="at">Hunt stop · {hunt.title}</p>
        <p className="as">
          {joined
            ? `You're hunting here — stop ${stopIdx + 1} of ${status.total}`
            : `Join the hunt to earn +${hunt.stopPts} here`}
        </p>
      </div>
      <IconChevronRight size={18} />
    </button>
  )
}
