import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/* App Review wants the privacy policy reachable from inside the app, not
   just from the listing. Settings is where people look for it. */

const mocks = vi.hoisted(() => ({ native: false }))
vi.mock('../../src/pwa/native', () => ({ isNativeApp: () => mocks.native }))

import SettingsScreen from '../../src/ui/Settings/SettingsScreen'

beforeEach(() => { mocks.native = false })

const wrap = () => render(<MemoryRouter><SettingsScreen /></MemoryRouter>)

describe('Settings → Help & legal', () => {
  it('links support, privacy and terms as same-origin pages on the web', () => {
    wrap()
    expect(screen.getByText('HELP & LEGAL')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /help & support/i })).toHaveAttribute('href', '/support')
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy')
    expect(screen.getByRole('link', { name: /terms of use/i })).toHaveAttribute('href', '/terms')
  })

  it('opens the live site from the wrapper, never the bundled copy', () => {
    mocks.native = true
    wrap()
    for (const [name, path] of [[/help & support/i, '/support'], [/privacy policy/i, '/privacy'], [/terms of use/i, '/terms']] as const) {
      const link = screen.getByRole('link', { name })
      expect(link).toHaveAttribute('href', `https://shootvantage.com${path}`)
      expect(link).toHaveAttribute('target', '_blank')
    }
  })
})
