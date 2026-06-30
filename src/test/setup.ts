import '@testing-library/jest-dom/vitest'
import tampaSpots from '../data/spots/tampa-bay'
import phillySpots from '../data/spots/philadelphia'
import { primeRegionSpots } from '../data/spots'

// Warm the per-region cache so the (async) useRegionSpots hook resolves
// synchronously in render tests.
primeRegionSpots('tampa-bay', tampaSpots)
primeRegionSpots('philadelphia', phillySpots)
