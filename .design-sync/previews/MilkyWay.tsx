/* MilkyWay — galactic-core planner shown ONLY for darkSky-tagged spots:
   next core window with peak altitude/bearing and a moon-wash verdict.
   Fixed `from` date keeps the window deterministic. */
import { MilkyWay, sampleSpots } from 'photo-scout'

/** Next core window + moon conditions for the local astro spot. */
export const CoreWindow = () => (
  <MilkyWay spot={sampleSpots.fortDeSoto} from={new Date(2026, 6, 8)} />
)
