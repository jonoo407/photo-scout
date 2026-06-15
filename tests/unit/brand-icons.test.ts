import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { manifestIcons, requiredPublicIcons } from '../../src/brand/icons'

// vitest runs with cwd = project root; resolve public/ from there (avoids vite's
// static analysis of `new URL(..., import.meta.url)`, which rewrites it to a glob).
const pub = (f: string) => resolve(process.cwd(), 'public', f)

describe('brand icon registry', () => {
  it('declares both an "any" and a "maskable" icon', () => {
    expect(manifestIcons.some((i) => i.purpose === 'maskable')).toBe(true)
    expect(manifestIcons.some((i) => i.purpose === 'any')).toBe(true)
  })

  it('has a 512px PNG for both any and maskable purposes', () => {
    expect(
      manifestIcons.find((i) => i.sizes === '512x512' && i.purpose === 'maskable' && i.type === 'image/png'),
    ).toBeTruthy()
    expect(
      manifestIcons.find((i) => i.sizes === '512x512' && i.purpose === 'any' && i.type === 'image/png'),
    ).toBeTruthy()
  })

  it('still offers a scalable SVG icon', () => {
    expect(manifestIcons.find((i) => i.type === 'image/svg+xml')).toBeTruthy()
  })
})

describe('brand icon files', () => {
  it('every required public icon file exists', () => {
    for (const f of requiredPublicIcons) {
      expect(existsSync(pub(f)), `${f} missing in public/`).toBe(true)
    }
  })

  it('every manifest icon src exists in public/', () => {
    for (const i of manifestIcons) {
      expect(existsSync(pub(i.src)), `${i.src} missing in public/`).toBe(true)
    }
  })
})
