import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SavedScreen from '../../src/ui/Saved/SavedScreen'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

function renderSaved() {
  return render(<MemoryRouter><SavedScreen /></MemoryRouter>)
}

beforeEach(() => {
  useStore.setState({
    home: DEFAULT_HOME, region: 'tampa-bay',
    wishlist: [], visited: [], checklist: {},
  })
})

describe('SavedScreen', () => {
  it('shows want-to-go and been-there spots — across cities', () => {
    useStore.setState({
      wishlist: ['bayshore-boulevard', 'independence-hall'], // Tampa + Philly
      visited: ['fort-de-soto-park'],
    })
    renderSaved()
    expect(screen.getByText('Bayshore Boulevard')).toBeInTheDocument()
    expect(screen.getByText('Independence Hall')).toBeInTheDocument()
    expect(screen.getByText('Fort De Soto Park')).toBeInTheDocument()
  })

  it('shows signature-shot progress for a spot with checked shots', () => {
    useStore.setState({
      visited: ['fort-de-soto-park'],
      checklist: { 'fort-de-soto-park': ['gulf-sunset'] }, // 1 of 2 shots
    })
    renderSaved()
    expect(screen.getByText(/1\/2 shots/)).toBeInTheDocument()
  })

  it('teaches the star when nothing is saved yet', () => {
    renderSaved()
    expect(screen.getByText(/nothing saved yet/i)).toBeInTheDocument()
    expect(screen.getByText(/want to go/i)).toBeInTheDocument()
  })
})
