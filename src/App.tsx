import { lazy, Suspense, useEffect } from 'react'
import { createHashRouter, RouterProvider, type RouteObject } from 'react-router-dom'
import { useStore, applyTheme } from './state/store'
import { initAuth } from './auth/useAuth'
import Layout from './ui/Layout'
import TodayScreen from './ui/Today/TodayScreen'
import BrowseScreen from './ui/Browse/BrowseScreen'
import PlanScreen from './ui/Plan/PlanScreen'
import DayScreen from './ui/Plan/DayScreen'
import SpotDetailScreen from './ui/SpotDetail/SpotDetailScreen'
import SettingsScreen from './ui/Settings/SettingsScreen'
import SavedScreen from './ui/Saved/SavedScreen'
import ClientListScreen from './ui/ClientList/ClientListScreen'

// Leaflet is ~150KB — load the Map screen only when it's opened.
const MapScreen = lazy(() => import('./ui/Map/MapScreen'))

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <TodayScreen /> },
      { path: '/browse', element: <BrowseScreen /> },
      { path: '/map', element: <Suspense fallback={<div className="screen"><p className="center-note">Loading map…</p></div>}><MapScreen /></Suspense> },
      { path: '/plan', element: <PlanScreen /> },
      { path: '/day', element: <DayScreen /> },
      { path: '/saved', element: <SavedScreen /> },
      { path: '/spot/:id', element: <SpotDetailScreen /> },
      { path: '/settings', element: <SettingsScreen /> },
    ],
  },
  // Client shoot shortlist — deliberately OUTSIDE Layout so the page a client
  // opens has no tab bar or app chrome.
  { path: '/list', element: <ClientListScreen /> },
]

const router = createHashRouter(routes)

export default function App() {
  const theme = useStore((s) => s.theme)
  useEffect(() => { applyTheme(theme) }, [theme])
  useEffect(() => { void initAuth() }, []) // no-op until auth env vars are set
  return <RouterProvider router={router} />
}
