import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/* Scaling guard (docs/SCALING.md finding 4): a city's photo metadata must be
   structurally its own — inline in the city module or in a per-city media
   file — never a shared cross-city file. Today the bundler happens to split
   a shared literal cleanly; at hundreds of cities a silent regression would
   ship every city's media to everyone. This test makes isolation a rule. */

const SPOTS_DIR = join(__dirname, '../../src/data/spots')

describe('per-city media isolation', () => {
  const cityFiles = readdirSync(SPOTS_DIR).filter((f) => f.endsWith('.ts'))

  it('city modules never import a shared media file', () => {
    for (const file of cityFiles) {
      const src = readFileSync(join(SPOTS_DIR, file), 'utf8')
      const region = file.replace(/\.ts$/, '')
      const mediaImports = [...src.matchAll(/from '([^']*spot-media[^']*)'/g)].map((m) => m[1])
      for (const imp of mediaImports) {
        expect(imp, `${file} may only import its own media file`).toBe(`../spot-media/${region}`)
      }
    }
  })

  it('there is no monolithic src/data/spot-media.ts left to grow', () => {
    const dataDir = readdirSync(join(SPOTS_DIR, '..'))
    expect(dataDir).not.toContain('spot-media.ts')
  })
})
