import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SpotHero from '../../src/ui/SpotDetail/SpotHero'

const media = [
  { src: 'a.jpg', caption: 'First', credit: 'x', license: 'CC' },
  { src: 'b.jpg', caption: 'Second', credit: 'y', license: 'CC' },
]

describe('SpotHero carousel dots', () => {
  it('renders the dots as tappable, labelled buttons', async () => {
    const user = userEvent.setup()
    render(<SpotHero media={media} />)
    const dot2 = screen.getByRole('button', { name: /photo 2/i })
    expect(dot2).toBeInTheDocument()
    await user.click(dot2) // must not throw even where scrollTo is unavailable
  })
})

describe('SpotHero photo specs', () => {
  it('shows the spec line for a photo that has specs', () => {
    render(<SpotHero media={[
      { src: 'a.jpg', caption: 'First', credit: 'x', license: 'CC', focalLengthMm: 24, fNumber: 8, iso: 100 },
    ]} />)
    expect(screen.getByText('24mm · f/8 · ISO 100')).toBeInTheDocument()
  })

  it('shows nothing extra when the photo has no specs', () => {
    render(<SpotHero media={media} />)
    expect(screen.queryByText(/mm|f\/|ISO/)).not.toBeInTheDocument()
  })
})
