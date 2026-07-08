/* Design-sync bundle entry — the app has no library build, so this file IS
   the design system's export surface: the reusable components Claude Design
   builds with. Screens are deliberately absent (they're compositions; their
   look ships via app.css + the conventions header). */
export { SpotCard } from '../src/ui/SpotCard'
export { default as SpotHero } from '../src/ui/SpotDetail/SpotHero'
export { default as Layout } from '../src/ui/Layout'
export { default as BestDays } from '../src/ui/SpotDetail/BestDays'
export { default as SunAlignment } from '../src/ui/SpotDetail/SunAlignment'
export { default as MilkyWay } from '../src/ui/SpotDetail/MilkyWay'
export { default as SpotNotes } from '../src/ui/SpotDetail/SpotNotes'
