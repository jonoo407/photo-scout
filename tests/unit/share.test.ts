import { describe, it, expect, vi, afterEach } from 'vitest'
import { shareLink } from '../../src/util/share'

/* Which path ran is not cosmetic: the caller shows a "copied" toast only for
   the clipboard path, because the native sheet is its own confirmation.
   Getting it backwards means either a silent copy or a double confirmation. */

afterEach(() => { vi.unstubAllGlobals() })

const withNavigator = (props: Record<string, unknown>) => {
  vi.stubGlobal('navigator', { ...props } as unknown as Navigator)
}

describe('shareLink', () => {
  it('uses the native share sheet when the device has one', async () => {
    const share = vi.fn(async () => {})
    const writeText = vi.fn(async () => {})
    withNavigator({ share, clipboard: { writeText } })

    expect(await shareLink('Bayshore Boulevard', 'https://shootvantage.com/l/abc')).toBe('shared')
    expect(share).toHaveBeenCalledWith({ title: 'Bayshore Boulevard', url: 'https://shootvantage.com/l/abc' })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('still reports "shared" when the user dismisses the sheet', async () => {
    // A dismissed share sheet rejects. Falling through to the clipboard here
    // would copy a link the user just decided not to send.
    const writeText = vi.fn(async () => {})
    withNavigator({ share: vi.fn(() => Promise.reject(new Error('AbortError'))), clipboard: { writeText } })

    expect(await shareLink('t', 'https://x.test')).toBe('shared')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('falls back to the clipboard on desktop', async () => {
    const writeText = vi.fn(async () => {})
    withNavigator({ clipboard: { writeText } })

    expect(await shareLink('t', 'https://x.test')).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://x.test')
  })

  it('does not throw when there is neither a share sheet nor a clipboard', async () => {
    withNavigator({})
    expect(await shareLink('t', 'https://x.test')).toBe('copied')
  })
})
