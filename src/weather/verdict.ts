import type { Category } from '../spots/types'

export type WeatherMood = 'clear' | 'partly' | 'cloudy' | 'rainy'

export interface WeatherInput {
  cloudCover: number // percent
  precipProbability: number // percent
}

export interface WeatherVerdict {
  mood: WeatherMood
  headline: string
  favors: Category[]
  avoid: Category[]
}

const OUTDOOR_BRIGHT: Category[] = ['skyline', 'beach', 'rooftop']
const SHELTERED: Category[] = ['interiors', 'gardens', 'architecture']

export function weatherVerdict({ cloudCover, precipProbability }: WeatherInput): WeatherVerdict {
  if (precipProbability >= 50) {
    return {
      mood: 'rainy',
      headline: 'Rain likely — head indoors: interiors, gardens and covered architecture.',
      favors: SHELTERED,
      avoid: ['skyline', 'rooftop', 'beach'],
    }
  }
  if (cloudCover <= 30) {
    return {
      mood: 'clear',
      headline: 'Clear skies — skylines, silhouettes and blue hour are on.',
      favors: OUTDOOR_BRIGHT,
      avoid: [],
    }
  }
  if (cloudCover <= 70) {
    return {
      mood: 'partly',
      headline: 'Partly cloudy — golden hour with interesting skies; stay flexible.',
      favors: ['skyline', 'beach', 'rooftop', 'gardens'],
      avoid: [],
    }
  }
  return {
    mood: 'cloudy',
    headline: 'Overcast — portraits, gardens and interiors; skip the skyline.',
    favors: SHELTERED,
    avoid: ['skyline'],
  }
}
