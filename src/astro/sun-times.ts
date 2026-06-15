import SunCalc from 'suncalc'

/* PhotoPills conventions (verified):
   - sunrise/sunset at -0.833 deg (suncalc default)
   - golden hour: sun elevation +6 deg down to -4 deg
   - blue hour:   sun elevation -4 deg down to -6 deg
   - civil/nautical/astronomical twilight at -6 / -12 / -18 (suncalc defaults)
   suncalc's built-in goldenHour is +6 -> sunset and has no blue hour, so we
   register custom -4 / +6 angle times to match PhotoPills. */
SunCalc.addTime(6, 'goldenMorningEnd', 'goldenEveningStart')
SunCalc.addTime(-4, 'goldenMorningStart', 'goldenEveningEnd')

export interface Window {
  start: Date
  end: Date
}

export interface SunTimes {
  sunrise: Date
  sunset: Date
  solarNoon: Date
  goldenHourMorning: Window
  goldenHourEvening: Window
  blueHourMorning: Window
  blueHourEvening: Window
  civilDawn: Date
  civilDusk: Date
  nauticalDawn: Date
  nauticalDusk: Date
  astronomicalDawn: Date
  astronomicalDusk: Date
}

export function computeSunTimes(date: Date, lat: number, lng: number): SunTimes {
  const t = SunCalc.getTimes(date, lat, lng) as unknown as Record<string, Date>
  return {
    sunrise: t.sunrise,
    sunset: t.sunset,
    solarNoon: t.solarNoon,
    goldenHourMorning: { start: t.goldenMorningStart, end: t.goldenMorningEnd },
    goldenHourEvening: { start: t.goldenEveningStart, end: t.goldenEveningEnd },
    blueHourMorning: { start: t.dawn, end: t.goldenMorningStart },
    blueHourEvening: { start: t.goldenEveningEnd, end: t.dusk },
    civilDawn: t.dawn,
    civilDusk: t.dusk,
    nauticalDawn: t.nauticalDawn,
    nauticalDusk: t.nauticalDusk,
    astronomicalDawn: t.nightEnd,
    astronomicalDusk: t.night,
  }
}
