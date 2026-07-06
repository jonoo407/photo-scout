import { describe, it, expect } from 'vitest'
import { allRegionIds } from '../../src/data/spots'
import { REGION_IDS, REGIONS } from '../../src/data/regions'

/* Scaling guard: a city exists when (a) REGIONS carries its metadata and
   (b) a src/data/spots/<id>.ts module holds its spots. The loader registry is
   derived from the filesystem (import.meta.glob), so these two must agree —
   this test fails loudly when someone adds one half of a city. */

describe('region registry', () => {
  it('every spots module has REGIONS metadata', () => {
    for (const id of allRegionIds()) {
      expect(REGIONS[id], `src/data/spots/${id}.ts has no REGIONS['${id}'] entry`).toBeDefined()
    }
  })

  it('every REGIONS entry has a spots module', () => {
    const modules = allRegionIds()
    for (const id of REGION_IDS) {
      expect(modules, `REGIONS['${id}'] has no src/data/spots/${id}.ts module`).toContain(id)
    }
  })
})
