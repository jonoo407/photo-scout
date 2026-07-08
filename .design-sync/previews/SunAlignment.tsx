/* SunAlignment — "sun-behind-the-subject" henge dates for a spot's shooting
   line. Fort De Soto faces due west (270°), so equinox sunsets align twice a
   year; the fixed `from` date keeps the rendered rows deterministic. */
import { SunAlignment, sampleSpots } from 'photo-scout'

/** Next henge-light dates card (sunset icon rows + delta captions). */
export const HengeDates = () => (
  <SunAlignment spot={sampleSpots.fortDeSoto} from={new Date(2026, 6, 8)} />
)
