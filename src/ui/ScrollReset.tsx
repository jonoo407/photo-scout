import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/* Hash-router navigation keeps the old scroll position, so Browse could open
   mid-list with its header offscreen. Jump to the top whenever the path
   changes (not on query/hash tweaks within a screen). */
export default function ScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}
