/* Candidate cities for the next-city scoreboard (B12) — data-driven so the
   ballot changes without touching the screen. Winner becomes the next
   curation target (docs/SCALING.md tier work). */

export interface CandidateCity {
  id: string
  label: string
}

export const CANDIDATE_CITIES: readonly CandidateCity[] = [
  { id: 'austin', label: 'Austin' },
  { id: 'denver', label: 'Denver' },
  { id: 'new-orleans', label: 'New Orleans' },
]
