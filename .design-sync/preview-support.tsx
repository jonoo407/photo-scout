/* Design-sync support module (merged into window.Vantage via extraEntries).
   DSProvider: several components read router context (SpotCard's useNavigate,
   Layout's NavLink/Outlet) — MemoryRouter satisfies them outside the app.
   sampleSpots: real Tampa Bay spots (media already merged by the data module)
   so previews show genuine content, never invented lorem. */
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import SPOTS from '../src/data/spots/tampa-bay'
import type { Spot } from '../src/spots/types'

export function DSProvider({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

const byId = (id: string): Spot => {
  const s = SPOTS.find((x) => x.id === id)
  if (!s) throw new Error(`preview fixture spot missing: ${id}`)
  return s
}

export const sampleSpots: Record<string, Spot> = {
  /** skyline park with seeded Commons photos — hero/media previews */
  curtisHixon: byId('curtis-hixon-waterfront-park'),
  /** dark-sky beach with tides + facing — MilkyWay/BestDays/SunAlignment */
  fortDeSoto: byId('fort-de-soto-park'),
  /** free 24h skyline walk, facing set — the "plain" card */
  bayshore: byId('bayshore-boulevard'),
}
