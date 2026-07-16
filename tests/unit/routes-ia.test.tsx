import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Navigate } from 'react-router-dom'
import type { ReactElement } from 'react'
import { routes } from '../../src/App'
import Layout from '../../src/ui/Layout'
import { useStore } from '../../src/state/store'

/* The IA restructure (handoff 1a, option picked): five tabs —
   Today · Explore · Plan · You · Community — with every old route
   redirecting (deep links in the wild are sacred). */

const layoutChildren = routes[0].children ?? []
const pathElement = (path: string) =>
  layoutChildren.find((r) => r.path === path)?.element as ReactElement | undefined

describe('route table', () => {
  it('serves the new IA surfaces under the tab layout', () => {
    const paths = layoutChildren.map((r) => r.path)
    for (const p of ['/', '/explore', '/plan', '/you', '/you/saved', '/you/shots', '/community', '/hunts', '/hunts/:id', '/day', '/spot/:id', '/suggest', '/settings']) {
      expect(paths).toContain(p)
    }
  })

  it('redirects every retired route to its new home', () => {
    const cases: Array<[string, string]> = [
      ['/browse', '/explore'],
      ['/map', '/explore?view=map'],
      ['/saved', '/you'],
    ]
    for (const [from, to] of cases) {
      const el = pathElement(from)
      expect(el, `${from} should still resolve`).toBeTruthy()
      expect(el!.type, `${from} should redirect`).toBe(Navigate)
      expect((el!.props as { to: string }).to, `${from} → ${to}`).toBe(to)
    }
  })

  it('keeps the chrome-free client list route outside the tab layout', () => {
    expect(routes.some((r) => r.path === '/list')).toBe(true)
  })
})

describe('tab bar', () => {
  it('shows the five new tabs in order', () => {
    render(<MemoryRouter><Layout /></MemoryRouter>)
    const labels = [...document.querySelectorAll('.tabbar a')].map((a) => a.textContent)
    expect(labels).toEqual(['Today', 'Explore', 'Plan', 'You', 'Community'])
  })

  it('wears the client-response dot on You (moved from Saved)', () => {
    useStore.setState({ newClientResponse: true })
    render(<MemoryRouter><Layout /></MemoryRouter>)
    const youTab = screen.getByRole('link', { name: /you/i })
    expect(youTab.querySelector('.tabdot')).toBeTruthy()
    expect(youTab.getAttribute('href')).toBe('/you')
  })
})
