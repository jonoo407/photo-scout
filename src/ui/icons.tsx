import {
  IconBuildingSkyscraper, IconBuildingCastle, IconGlassCocktail,
  IconBuildingChurch, IconPlant2, IconBeach, IconFeather,
  type IconProps,
} from '@tabler/icons-react'
import type { ComponentType } from 'react'
import type { Category, Light } from '../spots/types'

export const CategoryIcon: Record<Category, ComponentType<IconProps>> = {
  skyline: IconBuildingSkyscraper,
  rooftop: IconGlassCocktail,
  architecture: IconBuildingCastle,
  interiors: IconBuildingChurch,
  gardens: IconPlant2,
  beach: IconBeach,
  nature: IconFeather,
}

export const LIGHT_LABEL: Record<Light, string> = {
  sunrise: 'Sunrise',
  'morning-golden': 'Morning golden',
  'blue-hour': 'Blue hour',
  daytime: 'Daytime',
  'evening-golden': 'Evening golden',
  sunset: 'Sunset',
  'night-astro': 'Night / astro',
  'open-shade': 'Open shade',
}
