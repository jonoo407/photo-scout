import '@testing-library/jest-dom/vitest'
import tampaSpots from '../data/spots/tampa-bay'
import phillySpots from '../data/spots/philadelphia'
import { primeRegionSpots } from '../data/spots'

// Warm the per-region cache so the (async) useRegionSpots hook resolves
// synchronously in render tests.
primeRegionSpots('tampa-bay', tampaSpots)
primeRegionSpots('philadelphia', phillySpots)

// jsdom's Blob predates Blob#arrayBuffer, which every browser we ship to has.
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function (this: Blob) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(this)
    })
  }
}
