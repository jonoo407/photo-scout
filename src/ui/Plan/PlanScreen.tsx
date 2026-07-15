import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconRoute, IconMap2 } from '@tabler/icons-react'
import { useStore } from '../../state/store'
import { planPath } from '../../spots/plan-link'

/* Plan, narrowed to one job (IA redesign 1g): build, run, and store outings.
   The sun/moon reference table now lives on Today; the spots-by-light buckets
   became Explore's light-bucket chips. */
export default function PlanScreen() {
  const nav = useNavigate()
  const savedPlans = useStore((s) => s.savedPlans)
  const deletePlan = useStore((s) => s.deletePlan)
  const [armedDelete, setArmedDelete] = useState<string | null>(null)
  const [day, setDay] = useState<0 | 1>(0)

  return (
    <div className="screen">
      <div className="row-spread" style={{ margin: '4px 0 14px' }}>
        <h1 style={{ margin: 0 }}>Plan</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`chip ${day === 0 ? 'on' : ''}`} onClick={() => setDay(0)}>Today</button>
          <button className={`chip ${day === 1 ? 'on' : ''}`} onClick={() => setDay(1)}>Tomorrow</button>
        </div>
      </div>

      <button className="cta" style={{ marginBottom: 6 }} onClick={() => nav(`/day?day=${day}`)}>
        <IconRoute size={18} /> Smart-build {day === 1 ? "tomorrow's" : "today's"} shoot
      </button>
      <p className="small tertiary" style={{ margin: '0 2px 14px', lineHeight: 1.5 }}>
        Every stop matched to its light window and open hours, routed to cut driving,
        weather-aware, and partial to your Want-to-go list.
      </p>

      {savedPlans.length > 0 && (
        <>
          <h3 className="h3">Saved plans</h3>
          <div className="card list" style={{ marginBottom: 16 }}>
            {savedPlans.map((p) => (
              <div key={p.id} className="row" style={{ gap: 8 }}>
                <button
                  className="rowleft"
                  style={{ appearance: 'none', border: 0, background: 'none', cursor: 'pointer', color: 'var(--ink)', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: 0, minWidth: 0, textAlign: 'left' }}
                  onClick={() => nav(planPath(p.date, p.stops))}
                >
                  <span style={{ fontWeight: 500, fontSize: 14 }}><IconMap2 size={14} style={{ verticalAlign: '-2px' }} /> {p.name}</span>
                  <span className="small tertiary">{p.stops.length} {p.stops.length === 1 ? 'stop' : 'stops'}</span>
                </button>
                <button
                  className="chip act"
                  style={{ flex: 'none' }}
                  onClick={() => {
                    if (armedDelete === p.id) { deletePlan(p.id); setArmedDelete(null) }
                    else setArmedDelete(p.id)
                  }}
                >
                  {armedDelete === p.id ? 'Confirm delete' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
