/* SpotHero — the spot-detail hero: swipeable photo carousel with caption,
   EXIF specs and Commons credit, or the warm placeholder for photo-less
   spots. Media comes from real seeded spots (Wikimedia Commons). */
import { SpotHero, sampleSpots } from 'photo-scout'

/** Two-photo carousel with dots, caption + EXIF + credit. */
export const PhotoCarousel = () => <SpotHero media={sampleSpots.bayshore.media} />

/** No seeded photos yet — the warm amber placeholder. */
export const NoPhotosYet = () => <SpotHero media={[]} />
