import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TodayScreen from '../../src/ui/Today/TodayScreen'
import { useStore, EMPTY_FILTERS } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

beforeEach(() => {
  useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay', units: 'imperial', wishlist: [], filters: EMPTY_FILTERS })
})
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

  it('labels the sunset score with its grade', async () => {
    global.fetch = vi.fn(async () => okJson({
      // clear horizon + balanced mid/high cloud + low humidity => "great"
      current: { temperature_2m: 80, cloud_cover: 35, relative_humidity_2m: 50, weather_code: 2, wind_speed_10m: 5 },
      hourly: { time: [1], cloud_cover_low: [5], cloud_cover_mid: [40], cloud_cover_high: [30], relative_humidity_2m: [50] },
      daily: { time: [] },
    })) as unknown as typeof fetch
    render(<MemoryRouter><TodayScreen /></MemoryRouter>)
    expect(await screen.findByText(/sunset · great/i)).toBeInTheDocument()
  })

  it('"See all" carries the current light window into Browse as a filter', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn(async () => { throw new Error('offline') }) as unknown as typeof fetch
    render(<MemoryRouter><TodayScreen /></MemoryRouter>)
    await user.click(await screen.findByText(/see all .* spots for this window/i))
    expect(useStore.getState().filters.lights).toHaveLength(1)
  })
})
