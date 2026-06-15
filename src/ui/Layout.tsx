import type { ReactNode } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { IconSun, IconListSearch, IconMap2, IconCalendarEvent } from '@tabler/icons-react'

function Tab({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}

export default function Layout() {
  return (
    <>
      <Outlet />
      <nav className="tabbar">
        <Tab to="/" icon={<IconSun size={22} />} label="Today" />
        <Tab to="/browse" icon={<IconListSearch size={22} />} label="Browse" />
        <Tab to="/map" icon={<IconMap2 size={22} />} label="Map" />
        <Tab to="/plan" icon={<IconCalendarEvent size={22} />} label="Plan" />
      </nav>
    </>
  )
}
