import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import YouScreen from '../../src/ui/You/YouScreen'
import SettingsScreen from '../../src/ui/Settings/SettingsScreen'
import FeedbackScreen from '../../src/ui/You/FeedbackScreen'
import { useStore } from '../../src/state/store'

/* Placement half of backlog V2. The form shipped during TestFlight and was
   worded for testers — "Tester feedback", "goes straight to Jon". Real users
   are not testers and do not know who Jon is, so the entry point keeps its
   prominence on You but loses the beta framing, and Settings gains a row
   because that is where people look for it once the novelty is gone. */

beforeEach(() => {
  useStore.setState({ introSeen: true, sessions: 5, feedbackPromptAt: null })
})

const renderAt = (path: string, el: React.ReactElement) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes><Route path={path} element={el} /></Routes>
  </MemoryRouter>,
)

describe('feedback entry points', () => {
  it('You offers feedback without calling the user a tester', () => {
    renderAt('/you', <YouScreen />)
    const btn = screen.getByRole('button', { name: /send feedback/i })
    expect(btn).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /tester/i })).not.toBeInTheDocument()
  })

  it('Settings has a feedback row — where people look for it later', () => {
    renderAt('/settings', <SettingsScreen />)
    expect(screen.getByRole('button', { name: /send feedback/i })).toBeInTheDocument()
  })

  it('the form itself is worded for users, not for a beta', () => {
    renderAt('/you/feedback', <FeedbackScreen />)
    expect(screen.getByRole('heading', { name: /send feedback/i })).toBeInTheDocument()
    expect(screen.queryByText(/tester/i)).not.toBeInTheDocument()
    // "straight to Jon" meant something to twelve testers and nothing to anyone else.
    expect(screen.queryByText(/\bJon\b/)).not.toBeInTheDocument()
  })

  it('still attaches the version, which is why the reports are useful', () => {
    renderAt('/you/feedback', <FeedbackScreen />)
    // The actual stamp sent with the report, not just the word "build"
    // (which now also appears in "the person who builds Vantage").
    expect(screen.getByText(/Sent with Vantage .+ so the report can be traced/i)).toBeInTheDocument()
  })
})
