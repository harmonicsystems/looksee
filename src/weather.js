// The weather outside, for circle time: the temperature, a word for how it
// feels and a word for the sky, in English and Spanish. Pure: outside.js
// does the asking.
//
// The reading comes from Open-Meteo (open-meteo.com: free, no key, no
// account, no cookies). It is the only thing besides YouTube that Looksee
// ever contacts, and only when the Weather setting is on and someone opens
// the weather. What is sent is the place below, never anything about the
// device or the class.

// Where "outside" is. To move it: the name and the coordinates, to two
// decimal places (about a kilometre; no need to be more exact than a town).
export const PLACE = { name: 'Rhinebeck', lat: 41.93, lon: -73.91 }

export const weatherUrl = (p = PLACE) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit`

// How it feels, coldest first: each band starts at `from` °F. The order is
// also the order of a theme's `heat` colors (settings.js).
export const TEMPS = [
  { from: -Infinity, label: 'freezing', es: 'helado' },
  { from: 32, label: 'cold', es: 'frío' },
  { from: 50, label: 'cool', es: 'fresco' },
  { from: 65, label: 'warm', es: 'cálido' },
  { from: 80, label: 'hot', es: 'caluroso' }
]

// Which band a temperature is in: an index into TEMPS.
export const tempBand = (f) => TEMPS.reduce((b, t, i) => (f >= t.from ? i : b), 0)

// The sky, by Open-Meteo's weather code (the WMO codes). Each entry covers
// the codes up to and including `to`.
const SKIES = [
  { to: 0, emoji: '☀️', label: 'sunny', es: 'soleado' },
  { to: 2, emoji: '⛅', label: 'partly cloudy', es: 'algo nublado' },
  { to: 3, emoji: '☁️', label: 'cloudy', es: 'nublado' },
  { to: 48, emoji: '🌫️', label: 'foggy', es: 'con niebla' },
  { to: 57, emoji: '🌦️', label: 'drizzly', es: 'con llovizna' },
  { to: 67, emoji: '🌧️', label: 'rainy', es: 'lluvioso' },
  { to: 77, emoji: '🌨️', label: 'snowy', es: 'con nieve' },
  { to: 82, emoji: '🌧️', label: 'rainy', es: 'lluvioso' },
  { to: 86, emoji: '🌨️', label: 'snowy', es: 'con nieve' },
  { to: 99, emoji: '⛈️', label: 'stormy', es: 'tormentoso' }
]
// A clear sky after dark has no sun in it.
const NIGHT = { emoji: '🌙', label: 'clear', es: 'despejado' }

export function sky(code, day = true) {
  if (code === 0 && !day) return NIGHT
  return SKIES.find((x) => code <= x.to) ?? SKIES[2]
}

// What Open-Meteo answered, as { temp, band, sky }, or null when the answer
// is not a reading. The temperature is a whole number of °F.
export function readWeather(json) {
  const c = json?.current
  if (typeof c?.temperature_2m !== 'number' || !Number.isFinite(c.temperature_2m)) return null
  const temp = Math.round(c.temperature_2m)
  return { temp, band: tempBand(temp), sky: sky(Number.isInteger(c.weather_code) ? c.weather_code : 3, c.is_day !== 0) }
}

// What to say for the weather, one line per language shown: "42 degrees.
// cold. cloudy."
const DEGREES = { en: ['degree', 'degrees'], es: ['grado', 'grados'] }
export function weatherLines(w, langs) {
  const t = TEMPS[w.band]
  return langs.map((lang) => {
    const en = lang === 'en'
    const n = w.temp < 0 ? `${en ? 'minus' : 'menos'} ${-w.temp}` : w.temp
    return { lang, text: `${n} ${DEGREES[lang][Math.abs(w.temp) === 1 ? 0 : 1]}. ${en ? t.label : t.es}. ${en ? w.sky.label : w.sky.es}.` }
  })
}
