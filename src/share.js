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
import { SETS, GROUPS } from './concepts.js'
import { planQuery, queryPlan } from './plan.js'

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function encode(k, v) {
  if (k === 'sets') return v.join('.')
  if (k === 'plan') return planQuery(v)
  if (k === 'day') return JSON.stringify(v.map((p) => [p.at, p.icon]))
  if (typeof v === 'boolean') return v ? '1' : '0'
  return String(v)
}

function decode(k, v) {
  const d = DEFAULTS[k]
  if (k === 'sets') return v.split('.')
  if (k === 'plan') return queryPlan(v)
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

// What a set of sets is called: its groups' emoji and names. "➕ Math",
// "➕ Adding" (part of a group lists its sets), "🔤➕ Letters & Numbers + Math",
// "🔤➕🎨 Mix" for three groups or more, "All" for every set, '' for none.
export function setsName(sets) {
  if (SETS.every((x) => sets.includes(x.id))) return 'All'
  const parts = GROUPS.map((g) => {
    const on = g.sets.filter((id) => sets.includes(id))
    if (!on.length) return null
    const label = on.length === g.sets.length ? g.label : on.map((id) => SETS.find((x) => x.id === id).label).join(', ')
    return { emoji: g.emoji, label }
  }).filter(Boolean)
  const what = parts.length > 2 ? 'Mix' : parts.map((p) => p.label).join(' + ')
  return parts.length ? parts.map((p) => p.emoji).join('') + ' ' + what : ''
}

// What a bookmark or shortcut made from this setup is called: its sets, then
// the language, short enough for the bookmarks bar. "➕ Math · EN+ES",
// "🔤➕🎨 Mix · EN", "Looksee · All · EN" for every set, and for a plan its
// groups in the order they play and how long it is: "🔤➕😊 Plan, 30 min · EN".
const LANG = { en: 'EN', es: 'ES', both: 'EN+ES' }
export function setupName(s) {
  const lang = LANG[s.words] ?? 'EN'
  if (s.planOn && s.plan.length) {
    const emoji = []
    for (const b of s.plan) for (const g of GROUPS) if (!emoji.includes(g.emoji) && g.sets.some((id) => b.sets.includes(id))) emoji.push(g.emoji)
    return `${emoji.join('')} Plan, ${s.plan.reduce((n, b) => n + b.min, 0)} min · ${lang}`
  }
  const name = setsName(s.sets)
  return `${name === 'All' ? 'Looksee · All' : name} · ${lang}`
}
