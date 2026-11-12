// Settings as a link, so a classroom device can be set up by opening one.
// `?v=1&sets=adding.subtracting&mathTo=10` — `v=1` marks a Looksee link (and
// is the format's version); after it, only the settings that differ from the
// defaults. Everything travels, the school day and the video link included.
//
// A link is the whole setup: whatever it leaves out is the default, and it
// wins over what the device has saved, every time it opens. On a Chromebook
// every shortcut shares one storage, so this is the only way two shortcuts
// can stay different. (BackTrack does the same with `?p=`.)

import { DEFAULTS, normalizeSettings } from './settings.js'
import { SETS } from './concepts.js'

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function encode(k, v) {
  if (k === 'sets') return v.join('.')
  if (k === 'day') return JSON.stringify(v.map((p) => [p.at, p.icon]))
  if (typeof v === 'boolean') return v ? '1' : '0'
  return String(v)
}

function decode(k, v) {
  const d = DEFAULTS[k]
  if (k === 'sets') return v.split('.')
  if (k === 'day') {
    try {
      return JSON.parse(v).map(([at, icon]) => ({ at, icon }))
    } catch {
      return undefined
    }
  }
  if (typeof d === 'boolean') return v === '1'
  if (typeof d === 'number') return Number(v)
  return v
}

// The query string for these settings, without the '?'.
export function linkQuery(s) {
  const q = new URLSearchParams({ v: '1' })
  for (const k of Object.keys(DEFAULTS)) if (k in s && !same(s[k], DEFAULTS[k])) q.set(k, encode(k, s[k]))
  return q.toString()
}

// The settings a page address carries, or null when it is not a Looksee link.
// Unknown keys and bad values are dropped (normalizeSettings).
export function linkSettings(search) {
  const q = new URLSearchParams(search)
  if (q.get('v') !== '1') return null
  const raw = {}
  for (const k of Object.keys(DEFAULTS)) if (q.has(k)) raw[k] = decode(k, q.get(k))
  return normalizeSettings(raw)
}

// What a shortcut made from this setup is called: "Looksee · Adding,
// Subtracting", or the number of sets when there are more than two.
export function setupName(s) {
  const sets = SETS.filter((x) => s.sets.includes(x.id))
  if (same(s.sets, DEFAULTS.sets)) return 'Looksee'
  return `Looksee · ${sets.length > 2 ? `${sets.length} sets` : sets.map((x) => x.label).join(', ')}`
}
