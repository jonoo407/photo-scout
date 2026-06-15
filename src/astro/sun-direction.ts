/* Sun-direction badge: where is the light coming from, relative to the subject?

   Convention: `facing` is the bearing (deg from north) the photographer shoots
   TOWARD (camera -> subject). So:
   - sun roughly in the shooting direction (sunAz ≈ facing)  -> sun is behind the
     subject -> backlit / silhouette
   - sun roughly opposite (sunAz ≈ facing ± 180)             -> front-lit
   - perpendicular                                           -> side-lit
   Silhouette is a low (<= 10°) backlit sun. */

export type LightDirection = 'front' | 'side' | 'back' | 'silhouette'

/** Absolute angular separation between two compass bearings, 0–180°. */
export function relativeAngle(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180)
}

const SILHOUETTE_MAX_ELEVATION = 10

export function classifyLightDirection(
  sunAzimuth: number,
  facing: number,
  sunElevation: number,
): LightDirection {
  const rel = relativeAngle(sunAzimuth, facing)
  let base: LightDirection
  if (rel <= 45) base = 'back'
  else if (rel >= 135) base = 'front'
  else base = 'side'

  if (base === 'back' && sunElevation <= SILHOUETTE_MAX_ELEVATION) return 'silhouette'
  return base
}
