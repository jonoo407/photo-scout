import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Read the actual token values from theme.css so this guards real regressions.
// vitest runs with cwd at the project root.
const css = readFileSync('src/styles/theme.css', 'utf8')

function token(name: string): string {
  const m = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`)) // first hit = light :root
  if (!m) throw new Error(`token ${name} not found`)
  return m[1]
}
function lum(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}
function contrast(a: string, b: string): number {
  const la = lum(a), lb = lum(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

describe('secondary text contrast on the page background (WCAG)', () => {
  const bg = token('--bg')
  it('--ink-2 meets AA (>= 4.5:1)', () => {
    expect(contrast(token('--ink-2'), bg)).toBeGreaterThanOrEqual(4.5)
  })
  it('--ink-3 meets AA (>= 4.5:1) — axe holds 11-12px labels to this', () => {
    expect(contrast(token('--ink-3'), bg)).toBeGreaterThanOrEqual(4.5)
  })

  it('both muted inks also clear AA on the tan surface-2 (cards/inputs)', () => {
    const s2 = token('--surface-2')
    expect(contrast(token('--ink-2'), s2)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(token('--ink-3'), s2)).toBeGreaterThanOrEqual(4.5)
  })
})
