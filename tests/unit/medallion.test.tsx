import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Medallion } from '../../src/ui/You/Medallion'
import LadderSheet from '../../src/ui/You/LadderSheet'
import { TIERS, tierForPoints } from '../../src/craft/tiers'

/* Craft medallions (handoff 2b): each tier gets a visibly cooler ring —
   dashed → double ring → amber halo → terracotta tick ring → gold conic. */

describe('Medallion', () => {
  it('renders the tier numeral at every tier with a per-tier treatment class', () => {
    for (const tier of TIERS) {
      const { container, unmount } = render(<Medallion tier={tier} size={40} />)
      expect(container.textContent).toBe(tier.numeral)
      expect(container.querySelector(`.medallion.med-${tier.id}`)).toBeTruthy()
      unmount()
    }
  })

  it('wraps Artisan and Master in their gradient rings', () => {
    const artisan = render(<Medallion tier={TIERS[3]} size={40} />)
    expect(artisan.container.querySelector('.medring.med-artisan')).toBeTruthy()
    const master = render(<Medallion tier={TIERS[4]} size={40} />)
    expect(master.container.querySelector('.medring.med-master')).toBeTruthy()
  })
})

describe('LadderSheet', () => {
  it('lists all five tiers with thresholds and marks the current one', () => {
    const { container, getByText } = render(<LadderSheet points={1240} onClose={() => {}} />)
    for (const t of TIERS) expect(container.textContent).toContain(t.name)
    expect(getByText(/Craftsman — you/)).toBeTruthy()
    expect(getByText('now')).toBeTruthy()
    // Next tier shows the real gap (1240 → 2500), later tiers read locked.
    expect(container.textContent).toContain('1,260 to go')
    expect(container.textContent).toContain('locked')
    expect(container.textContent).toContain('2,500 pts')
    expect(container.textContent).toContain('6,000 pts')
  })

  it('shows the point economy chips', () => {
    const { container } = render(<LadderSheet points={0} onClose={() => {}} />)
    expect(container.textContent).toContain('Hunt stop +25')
    expect(container.textContent).toContain('Hunt finished +100')
    expect(container.textContent).toContain('Critique given +15')
    expect(container.textContent).toContain('+200')
    expect(container.textContent).toContain('+10')
  })

  it('tops out at Master with no next-tier line', () => {
    const { container } = render(<LadderSheet points={9000} onClose={() => {}} />)
    expect(tierForPoints(9000).id).toBe('master')
    expect(container.textContent).toContain('Top of the ladder')
    expect(container.textContent).not.toContain('to go')
  })

  it('closes on backdrop tap but not on sheet tap', () => {
    const onClose = vi.fn()
    const { container } = render(<LadderSheet points={0} onClose={onClose} />)
    fireEvent.click(container.querySelector('.sheet')!)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(container.querySelector('.sheet-backdrop')!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
