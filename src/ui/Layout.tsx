import type { ReactNode } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { IconSun, IconListSearch, IconMap2, IconCalendarEvent, IconStar } from '@tabler/icons-react'
import { useStore } from '../state/store'
import ScrollReset from './ScrollReset'

function Tab({ to, icon, label, dot }: { to: string; icon: ReactNode; label: string; dot?: boolean }) {
  return (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
      <span className="tabicon">
        {icon}
        {dot && <span className="tabdot" aria-hidden />}
      </span>
      <span>{label}</span>
    </NavLink>
  )
}

export default function Layout() {
  // A client responded to a shortlist since the last look → dot on Saved.
  const hasNewResponse = useStore((s) => s.newClientResponse)
  return (
    <>
      <ScrollReset />
      <Outlet />
      <nav className="tabbar">
        <Tab to="/" icon={<IconSun size={22} />} label="Today" />
        <Tab to="/browse" icon={<IconListSearch size={22} />} label="Browse" />
        <Tab to="/map" icon={<IconMap2 size={22} />} label="Map" />
        <Tab to="/plan" icon={<IconCalendarEvent size={22} />} label="Plan" />
        <Tab to="/saved" icon={<IconStar size={22} />} label="Saved" dot={hasNewResponse} />
      </nav>
    </>
  )
}
