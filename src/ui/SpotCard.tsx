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
  spot, badge, reason, meta,
}: {
  spot: Spot
  badge?: Badge
  reason?: string
  meta?: ReactNode
}) {
  const nav = useNavigate()
  const Icon = CategoryIcon[spot.category]
  return (
    <button className="spotcard" onClick={() => nav(`/spot/${spot.id}`)}>
      <div className="body">
        <div className="thumbicon" style={{ background: 'var(--surface-2)' }}>
          <Icon size={22} color={CATEGORY_COLOR[spot.category]} />
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
