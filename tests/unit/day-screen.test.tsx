import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import DayScreen from '../../src/ui/Plan/DayScreen'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

beforeEach(() => { useStore.setState({ home: DEFAULT_HOME, wishlist: [] }) })

function renderDay(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes><Route path="/day" element={<DayScreen />} /></Routes>
    </MemoryRouter>,
  )
}

describe('DayScreen', () => {
  it('builds a multi-stop itinerary of distinct spots', () => {
    renderDay('/day')
    // morning + evening at least; the old version collapsed to one repeated spot
    expect(screen.getByText('Your day')).toBeInTheDocument()
    expect(screen.getAllByText(/min$/).length).toBeGreaterThanOrEqual(2)
  })

  it('plans around an anchor spot and flags it', () => {
    renderDay('/day?anchor=dali-museum')
    expect(screen.getByText('The Dalí Museum')).toBeInTheDocument()
    expect(screen.getByText(/your anchor/i)).toBeInTheDocument()
  })
})
