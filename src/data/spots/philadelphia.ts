import type { Spot } from '../../spots/types'

// Philadelphia — ready for spots. Append Spot objects with region:'philadelphia'
// and lat/lng inside the Philly bounds (see src/data/regions.ts). This module is
// lazy-loaded, so adding cities never grows the initial bundle.
const SPOTS: Spot[] = []

export default SPOTS
