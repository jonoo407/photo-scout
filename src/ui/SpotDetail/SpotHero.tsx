import { useState, useRef } from 'react'
import { IconPhoto } from '@tabler/icons-react'
import type { SpotMedia } from '../../spots/types'
import { mediaSpecs } from '../../spots/media-specs'

// Swipeable hero photo carousel for the Spot detail page. Falls back to a warm
// placeholder when a spot has no seeded photos yet (the user can add their own).
export default function SpotHero({ media }: { media: SpotMedia[] }) {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  if (media.length === 0) {
    return (
      <div className="hero" style={{ background: 'var(--amber)' }}>
        <IconPhoto size={30} />
        <span className="cap">Add your own photo from this spot</span>
      </div>
    )
  }

  const onScroll = () => {
    const el = trackRef.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== active) setActive(Math.max(0, Math.min(media.length - 1, i)))
  }

  const goTo = (i: number) => {
    const el = trackRef.current
    if (!el) return
    setActive(i)
    el.scrollTo?.({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  const cur = media[active] ?? media[0]

  return (
    <div className="carousel">
      <div className="carousel-track" ref={trackRef} onScroll={onScroll} tabIndex={0} role="group" aria-label="Spot photos (scroll horizontally)">
        {media.map((m, i) => (
          <div className="slide" key={m.src + i}>
            <img src={m.src} alt={m.caption} loading={i === 0 ? 'eager' : 'lazy'} />
          </div>
        ))}
      </div>

      <div className="slide-cap">
        <span className="cap-text">{cur.caption}</span>
        {mediaSpecs(cur) && <span className="cap-specs">{mediaSpecs(cur)}</span>}
        {cur.sourceUrl ? (
          <a className="cap-credit" href={cur.sourceUrl} target="_blank" rel="noreferrer">
            {cur.credit} · {cur.license}
          </a>
        ) : (
          <span className="cap-credit">{cur.credit} · {cur.license}</span>
        )}
      </div>

      {media.length > 1 && (
        <div className="carousel-dots">
          {media.map((m, i) => (
            <button
              key={m.src + i}
              className={`dot ${i === active ? 'on' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Photo ${i + 1} of ${media.length}`}
              aria-current={i === active}
            />
          ))}
        </div>
      )}
    </div>
  )
}
