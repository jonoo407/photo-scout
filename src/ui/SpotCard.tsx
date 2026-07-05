import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { IconMapPin } from '@tabler/icons-react'
import type { Spot } from '../spots/types'
import { CATEGORY_COLOR } from '../spots/types'
import { CategoryIcon } from './icons'

export interface Badge {
  label: string
  kind: 'go' | 'maybe' | 'skip' | 'info' | 'open' | 'closed'
}

export function SpotCard({
  spot, badge, reason, meta, onPress,
}: {
  spot: Spot
  badge?: Badge
  reason?: string
  meta?: ReactNode
  onPress?: () => void // overrides the default navigate-to-detail (e.g. shortlist pick mode)
}) {
  const nav = useNavigate()
  const Icon = CategoryIcon[spot.category]
  const photo = spot.media[0]?.thumb ?? spot.media[0]?.src
  return (
    <button className="spotcard" onClick={onPress ?? (() => nav(`/spot/${spot.id}`))}>
      <div className="body">
        <div className="thumbicon" style={photo ? undefined : { background: 'var(--surface-2)' }}>
          {photo
            ? <img src={photo} alt="" loading="lazy" decoding="async" />
            : <Icon size={22} color={CATEGORY_COLOR[spot.category]} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row-spread" style={{ gap: 8 }}>
            <span className="nm">{spot.name}</span>
            {badge && <span className={`pill ${badge.kind}`}>{badge.label}</span>}
          </div>
          {reason && <p className="sub">{reason}</p>}
          <p className="cardaddr"><IconMapPin size={12} /> {spot.address}</p>
          {meta && <p className="meta">{meta}</p>}
        </div>
      </div>
    </button>
  )
}
