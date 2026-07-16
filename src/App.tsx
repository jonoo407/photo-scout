import { useEffect } from 'react'
import { createHashRouter, RouterProvider, Navigate, type RouteObject } from 'react-router-dom'
import { useStore, applyTheme } from './state/store'
import { initAuth, useAuth } from './auth/useAuth'
import { refreshResponsesBadge } from './spots/shortlist-api'
import Layout from './ui/Layout'
import TodayScreen from './ui/Today/TodayScreen'
import ExploreScreen from './ui/Explore/ExploreScreen'
import PlanScreen from './ui/Plan/PlanScreen'
import DayScreen from './ui/Plan/DayScreen'
import SpotDetailScreen from './ui/SpotDetail/SpotDetailScreen'
import SettingsScreen from './ui/Settings/SettingsScreen'
import YouScreen from './ui/You/YouScreen'
import YourShotsScreen from './ui/You/YourShotsScreen'
import SavedScreen from './ui/Saved/SavedScreen'
import CommunityScreen from './ui/Community/CommunityScreen'
import HuntsHubScreen from './ui/Hunts/HuntsHubScreen'
import HuntDetailScreen from './ui/Hunts/HuntDetailScreen'
import ClientListScreen from './ui/ClientList/ClientListScreen'
import SuggestScreen from './ui/Suggest/SuggestScreen'
import ErrorScreen from './ui/ErrorScreen'

/* The five-tab IA (redesign 1a): Today · Explore · Plan · You · Community.
   Old routes redirect — deep links in the wild are sacred. */
export const routes: RouteObject[] = [
  {
    element: <Layout />,
    // Stale sessions straddling a deploy must never see the raw router
    // error screen (incident 2026-07-16) — recover with a branded reload.
    errorElement: <ErrorScreen />,
    children: [
      { path: '/', element: <TodayScreen /> },
      { path: '/explore', element: <ExploreScreen /> },
      { path: '/plan', element: <PlanScreen /> },
      { path: '/day', element: <DayScreen /> },
      { path: '/you', element: <YouScreen /> },
      { path: '/you/saved', element: <SavedScreen /> },
      { path: '/you/shots', element: <YourShotsScreen /> },
      { path: '/community', element: <CommunityScreen /> },
      { path: '/hunts', element: <HuntsHubScreen /> },
      { path: '/hunts/:id', element: <HuntDetailScreen /> },
      { path: '/spot/:id', element: <SpotDetailScreen /> },
      { path: '/suggest', element: <SuggestScreen /> },
      { path: '/settings', element: <SettingsScreen /> },
      // Retired routes (pre-2026-07 IA) — keep old bookmarks working.
      { path: '/browse', element: <Navigate to="/explore" replace /> },
      { path: '/map', element: <Navigate to="/explore?view=map" replace /> },
      { path: '/saved', element: <Navigate to="/you" replace /> },
      // Anything this bundle has never heard of (a newer deploy's deep link
      // reaching an older cached bundle, a typo) lands on Today, not a 404.
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
  // Client shoot shortlist — deliberately OUTSIDE Layout so the page a client
  // opens has no tab bar or app chrome.
  { path: '/list', element: <ClientListScreen />, errorElement: <ErrorScreen /> },
]

const router = createHashRouter(routes)

export default function App() {
  const theme = useStore((s) => s.theme)
  useEffect(() => { applyTheme(theme) }, [theme])
  useEffect(() => { void initAuth() }, []) // no-op until auth env vars are set
  // Once per sign-in: check for client shortlist responses → You-tab dot.
  useEffect(() => {
    let prevId: string | null = null
    return useAuth.subscribe((s) => {
      const id = s.user?.id ?? null
      if (id && id !== prevId) void refreshResponsesBadge()
      prevId = id
    })
  }, [])
  return <RouterProvider router={router} />
}
