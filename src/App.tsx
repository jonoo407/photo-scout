import { useEffect } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { useStore, applyTheme } from './state/store'
import Layout from './ui/Layout'
import TodayScreen from './ui/Today/TodayScreen'
import BrowseScreen from './ui/Browse/BrowseScreen'
import MapScreen from './ui/Map/MapScreen'
import PlanScreen from './ui/Plan/PlanScreen'
import DayScreen from './ui/Plan/DayScreen'
import SpotDetailScreen from './ui/SpotDetail/SpotDetailScreen'
import SettingsScreen from './ui/Settings/SettingsScreen'

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <TodayScreen /> },
      { path: '/browse', element: <BrowseScreen /> },
      { path: '/map', element: <MapScreen /> },
      { path: '/plan', element: <PlanScreen /> },
      { path: '/day', element: <DayScreen /> },
      { path: '/spot/:id', element: <SpotDetailScreen /> },
      { path: '/settings', element: <SettingsScreen /> },
    ],
  },
])

export default function App() {
  const theme = useStore((s) => s.theme)
  useEffect(() => { applyTheme(theme) }, [theme])
  return <RouterProvider router={router} />
}
