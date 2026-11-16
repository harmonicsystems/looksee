// Asks Open-Meteo for the weather (not pure: weather.js says what to ask and
// reads the answer). Called only when someone opens the weather, never on
// load. No cookies and no referrer go with the request, and the reading is
// kept in memory only, for ten minutes, so opening it again does not ask again.
import { weatherUrl, readWeather } from './weather.js'

const FRESH = 10 * 60 * 1000
let last = null

// Resolves to { temp, band, sky, at } (at: when it was read), or rejects
// when the weather can't be reached or makes no sense.
export async function getWeather() {
  if (last && Date.now() - last.at < FRESH) return last
  const stop = new AbortController()
  const t = setTimeout(() => stop.abort(), 10000)
  try {
    const r = await fetch(weatherUrl(), { credentials: 'omit', referrerPolicy: 'no-referrer', signal: stop.signal })
    const w = r.ok && readWeather(await r.json())
    if (!w) throw new Error('no reading')
    return (last = { ...w, at: Date.now() })
  } finally {
    clearTimeout(t)
  }
}
