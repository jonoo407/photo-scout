import type { ReactNode } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { IconSun, IconCompass, IconRoute, IconUser, IconUsers } from '@tabler/icons-react'
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

/* The five-tab IA (redesign 1a): Today · Explore · Plan · You · Community. */
export default function Layout() {
  // A client responded to a shortlist since the last look → dot on You
  // (responses are notifications; notifications live on the identity tab).
  const hasNewResponse = useStore((s) => s.newClientResponse)
  return (
    <>
      <ScrollReset />
      <Outlet />
      <nav className="tabbar">
        <Tab to="/" icon={<IconSun size={22} />} label="Today" />
        <Tab to="/explore" icon={<IconCompass size={22} />} label="Explore" />
        <Tab to="/plan" icon={<IconRoute size={22} />} label="Plan" />
        <Tab to="/you" icon={<IconUser size={22} />} label="You" dot={hasNewResponse} />
        <Tab to="/community" icon={<IconUsers size={22} />} label="Community" />
      </nav>
    </>
  )
}
