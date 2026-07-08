/* BestDays — "best days this month" scoring card: date rows with reason
   captions and a 0-100 score pill (go/maybe/info coloring). Fort De Soto
   exercises the full scorer (sunset light + tides + gate hours). Rows rank
   from the live date; the forecast fetch degrades gracefully offline. */
import { BestDays, sampleSpots } from 'photo-scout'

/** Ranked shooting days with score pills. */
export const RankedDays = () => <BestDays spot={sampleSpots.fortDeSoto} />
