/* One-shot device location for the hunt geo rule (handoff 2d: the shot must
   be taken within 150 m of the stop — the server re-checks the distance).

   Delegates to src/geo/position.ts so native resolves through CoreLocation:
   navigator.geolocation is present in WKWebView but never calls back. */
export { getPosition } from '../geo/position'
