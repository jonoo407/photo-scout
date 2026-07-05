import { describe, it, expect } from 'vitest'
import { listOgHtml } from '../../src/spots/list-og'

const UUID = '38a9ffbb-d704-4bf1-a7f5-e9d2758a19a3'

describe('listOgHtml', () => {
  it('serves per-list OG tags and forwards to the app view', () => {
    const html = listOgHtml(UUID, 'Smith family', 3)
    expect(html).toContain('<meta property="og:title" content="Smith family — location options"')
    expect(html).toContain('3 spots to pick from')
    expect(html).toContain(`url=/#/list?id=${UUID}`)
    expect(html).toContain('og:image')
  })

  it('falls back to a generic title', () => {
    const html = listOgHtml(UUID, null, 1)
    expect(html).toContain('<meta property="og:title" content="Location options"')
    expect(html).toContain('1 spot to pick from')
  })

  it('escapes hostile titles', () => {
    const html = listOgHtml(UUID, '"><script>alert(1)</script>', 2)
    expect(html).not.toContain('<script>alert')
    expect(html).toContain('&lt;script&gt;')
  })
})
