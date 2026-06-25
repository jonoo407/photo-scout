import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TodayScreen from '../../src/ui/Today/TodayScreen'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

beforeEach(() => { useStore.setState({ home: DEFAULT_HOME, units: 'imperial', wishlist: [] }) })
afterEach(() => { vi.restoreAllMocks() })

const okJson = (body: unknown) =>
  ({ ok: true, json: async () => body }) as unknown as Response

describe('TodayScreen weather', () => {
  it('shows "Weather unavailable" instead of a permanent "Loading…" when the fetch fails', async () => {
    global.fetch = vi.fn(async () => { throw new Error('offline') }) as unknown as typeof fetch
    render(<MemoryRouter><TodayScreen /></MemoryRouter>)
    expect(await screen.findByText(/weather unavailable/i)).toBeInTheDocument()
  })

  it('renders the temperature with the metric unit when units = metric', async () => {
    useStore.setState({ units: 'metric' })
    global.fetch = vi.fn(async () => okJson({
      current: { temperature_2m: 31.6, cloud_cover: 20, relative_humidity_2m: 60, weather_code: 1, wind_speed_10m: 10 },
      hourly: { time: [] }, daily: { time: [] },
    })) as unknown as typeof fetch
    render(<MemoryRouter><TodayScreen /></MemoryRouter>)
    expect(await screen.findByText('32°C')).toBeInTheDocument()
  })
})
