/* Layout — the app chrome: five-tab bottom bar (Today/Browse/Map/Plan/Saved)
   with the notification dot slot on Saved. The .tabbar is position:fixed in
   the app; the transformed phone-frame wrapper makes it a containing block so
   the bar pins to the frame's bottom edge in the preview. */
import { Layout } from 'photo-scout'

/** The five-tab bar pinned to a phone-frame's bottom edge. */
export const TabBar = () => (
  <div
    style={{
      transform: 'translateZ(0)',
      width: 390,
      height: 150,
      margin: '0 auto',
      background: 'var(--bg)',
      overflow: 'hidden',
      borderRadius: 12,
      border: '0.5px solid var(--line)',
    }}
  >
    <Layout />
  </div>
)
