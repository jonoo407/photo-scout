import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CompassMode from '../../src/ui/SpotDetail/CompassMode'
import type { Spot } from '../../src/spots/types'

const spot = {
  id: 'x', name: 'X', lat: 27.94, lng: -82.55, region: 'tampa-bay',
  category: 'beach', bestLight: ['sunset'],
} as unknown as Spot

const FROM = new Date('2026-06-15T16:00:00Z')

function orient(data: { alpha?: number | null; absolute?: boolean }) {
  const e = new Event('deviceorientation')
  Object.assign(e, data)
  act(() => { fireEvent(window, e) })
}

describe('CompassMode', () => {
  it('opens from a chip and names the sun bearing at the prime window', async () => {
    const user = userEvent.setup()
    render(<CompassMode spot={spot} from={FROM} />)
    await user.click(screen.getByRole('button', { name: /compass/i }))
    expect(screen.getByText(/sun at/i)).toBeInTheDocument()
    expect(screen.getAllByText(/\d+°/).length).toBeGreaterThan(0)
  })

  it('without a sensor reading it says to sweep the phone', async () => {
    const user = userEvent.setup()
    render(<CompassMode spot={spot} from={FROM} />)
    await user.click(screen.getByRole('button', { name: /compass/i }))
    expect(screen.getByText(/point your phone|no compass/i)).toBeInTheDocument()
  })

  it('rotates the arrow from live orientation readings', async () => {
    const user = userEvent.setup()
    render(<CompassMode spot={spot} from={FROM} />)
    await user.click(screen.getByRole('button', { name: /compass/i }))
    orient({ alpha: 90, absolute: true }) // device faces 270°
    expect(screen.getByText(/facing 270°/i)).toBeInTheDocument()
    const arrow = screen.getByTestId('compass-arrow')
    expect(arrow.style.transform).toMatch(/rotate\(-?\d+(\.\d+)?deg\)/)
  })
})
