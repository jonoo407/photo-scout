import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* wrangler.jsonc drives the Cloudflare deploy (Workers Builds uses the repo
   config when present). Guard the essentials: same Worker name, assets dir,
   and BOTH domains — apex and www — attached as custom domains. */
describe('wrangler.jsonc deploy config', () => {
  const raw = readFileSync(resolve(__dirname, '../../wrangler.jsonc'), 'utf8')
  const config = JSON.parse(raw.replace(/\/\/.*$/gm, '')) // strip // comments

  it('deploys to the existing Worker with the built assets', () => {
    expect(config.name).toBe('vantage')
    expect(config.assets.directory).toBe('./dist')
    expect(config.compatibility_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('attaches BOTH shootvantage.com and www as custom domains', () => {
    const domains = (config.routes ?? []).filter((r: { custom_domain?: boolean }) => r.custom_domain).map((r: { pattern: string }) => r.pattern)
    expect(domains).toContain('shootvantage.com')
    expect(domains).toContain('www.shootvantage.com')
  })
})
