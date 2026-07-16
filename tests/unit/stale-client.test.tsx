import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, Navigate } from 'react-router-dom'
import type { ReactElement } from 'react'
import { routes } from '../../src/App'
import ErrorScreen from '../../src/ui/ErrorScreen'
import { wireUpdateChecks } from '../../src/pwa/sw-updates'

/* Stale-client hardening (incident 2026-07-16): a session running an old
   bundle followed a new-IA link and hit React Router's raw developer error
   screen. Three defenses: unknown routes redirect home instead of erroring,
   render errors show a branded recovery screen, and long-lived sessions
   keep checking for new service workers so they reload onto fresh code. */

describe('unknown routes land on Today, never an error screen', () => {
  it('has a catch-all redirect in the route table', () => {
    const layoutChildren = routes[0].children ?? []
    const catchAll = layoutChildren.find((r) => r.path === '*')
    expect(catchAll, 'catch-all route').toBeTruthy()
    const el = catchAll!.element as ReactElement
    expect(el.type).toBe(Navigate)
    expect((el.props as { to: string }).to).toBe('/')
  })

  it('renders Today for a route this bundle has never heard of', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/some-future-feature'] })
    render(<RouterProvider router={router} />)
    expect(await screen.findByText(/next up/i)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })
})

describe('branded error recovery', () => {
  it('every top-level route carries the recovery errorElement', () => {
    for (const r of routes) expect(r.errorElement, `errorElement on ${r.path ?? 'layout'}`).toBeTruthy()
  })

  it('offers a reload — the one action that heals a stale session', () => {
    render(<ErrorScreen />)
    expect(screen.getByText(/something went sideways/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
  })
})

describe('wireUpdateChecks — stale sessions discover new deploys', () => {
  afterEach(() => { vi.useRealTimers() })

  it('checks on an interval', () => {
    vi.useFakeTimers()
    const check = vi.fn()
    const cleanup = wireUpdateChecks(check, { intervalMs: 60_000, minGapMs: 10_000 })
    vi.advanceTimersByTime(60_000 * 3 + 1)
    expect(check).toHaveBeenCalledTimes(3)
    cleanup()
    vi.advanceTimersByTime(60_000 * 3)
    expect(check).toHaveBeenCalledTimes(3) // cleaned up — no further checks
  })

  it('checks when the app returns to the foreground, throttled', () => {
    vi.useFakeTimers()
    const check = vi.fn()
    const cleanup = wireUpdateChecks(check, { intervalMs: 3_600_000, minGapMs: 10_000 })
    const wake = () => document.dispatchEvent(new Event('visibilitychange'))

    wake()
    expect(check).toHaveBeenCalledTimes(1)
    wake() // 0ms later — inside the throttle gap
    expect(check).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(10_001)
    wake()
    expect(check).toHaveBeenCalledTimes(2)
    cleanup()
  })
})
