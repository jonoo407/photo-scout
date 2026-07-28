// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import tampa from '../../src/data/spots/tampa-bay'
import philly from '../../src/data/spots/philadelphia'

/*
 * Spot photos are served from our own origin, not hotlinked from Wikimedia.
 *
 * Hotlinking cost us: upstream rate limits (429s), no control over cache
 * headers, files renamed or deleted out from under us (the reason
 * scripts/fix-media-hashes.mjs had to exist), and — under capacitor://localhost
 * — opaque responses that the service worker cached as if valid, blanking
 * thumbnails on TestFlight build 3.
 *
 * Local files also mean `cap sync` copies them into the IPA, so the phone has
 * every thumbnail on disk with no network at all.
 *
 * The CC BY / CC BY-SA licences permit this redistribution; they require
 * attribution, which is why the credit/licence/source assertions below are not
 * optional extras — they are the terms we are hosting under.
 */
const PUBLIC = path.resolve(__dirname, '../../public')

const photos = [...tampa, ...philly].flatMap((s) =>
  (s.media ?? []).map((m) => ({ spot: s.id, ...m })),
)

describe('spot media is self-hosted', () => {
  it('has photos to check', () => {
    expect(photos.length).toBeGreaterThan(100)
  })

  it('never points at a third-party image host', () => {
    const remote = photos
      .flatMap((p) => [p.src, p.thumb])
      .filter((u) => /^https?:\/\//i.test(u ?? ''))
    expect(remote).toEqual([])
  })

  it('ships every referenced file in public/', () => {
    const missing = photos
      .flatMap((p) => [p.src, p.thumb])
      .filter(Boolean)
      .map((u) => u!.replace(/^\.?\//, ''))
      .filter((rel) => !fs.existsSync(path.join(PUBLIC, rel)))
    expect([...new Set(missing)]).toEqual([])
  })

  it('uses a distinct, smaller file for the card thumbnail', () => {
    const sameFile = photos.filter((p) => p.thumb && p.src && p.thumb === p.src)
    expect(sameFile.map((p) => p.spot)).toEqual([])
  })

  it('keeps the attribution the licence requires on every photo', () => {
    const unattributed = photos
      .filter((p) => !p.credit?.trim() || !p.license?.trim() || !/^https?:\/\//.test(p.sourceUrl ?? ''))
      .map((p) => p.spot)
    expect([...new Set(unattributed)]).toEqual([])
  })
})
