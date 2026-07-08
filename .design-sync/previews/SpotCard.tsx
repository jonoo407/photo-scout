/* SpotCard — the app's flagship list card: photo/category thumb, name,
   status pill, why-line ("sell the shot, not the street"). Compositions
   mirror real call sites: Browse rows, Today's ranked list, and the
   Saved-tab shortlist pick mode. */
import { SpotCard, sampleSpots } from 'photo-scout'

const { bayshore, curtisHixon, fortDeSoto } = sampleSpots

/** Browse row: seeded photo thumb + bestFor why-line. */
export const WithPhoto = () => <SpotCard spot={curtisHixon} />

/** Today's Next Up styling: go pill + a conditions reason line. */
export const GoNow = () => (
  <SpotCard
    spot={bayshore}
    badge={{ label: 'Golden hour', kind: 'go' }}
    reason="Clear west sky — sunset in 40 min, skyline front-lit"
  />
)

/** Marginal conditions: maybe pill + drive metadata. */
export const MaybeTonight = () => (
  <SpotCard
    spot={fortDeSoto}
    badge={{ label: 'Partly cloudy', kind: 'maybe' }}
    meta="50 min drive · gates close at dusk"
  />
)

/** Shortlist pick mode (Saved tab): onPress overrides navigation. */
export const PickMode = () => (
  <SpotCard spot={bayshore} onPress={() => {}} badge={{ label: 'Added', kind: 'go' }} />
)
