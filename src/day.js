// The school-day bar: a list of parts, each starting at a time and shown as a
// few emoji, plus the time the day ends. Pure logic; App.svelte draws it.
// The emoji here are plain text in the device's own emoji font — no files.
//
// A part can also have its own sets (`sets`, kept only when there are some).
// With "Follow the school day" on (`daySets`), the part the clock is in plays
// its sets: the schedule is the same every day.

import { SETS } from './concepts.js'

export const DAY_DEFAULT = [
  { at: '08:00', icon: '✏️📚' },
  { at: '11:30', icon: '🍎🥪' },
  { at: '12:15', icon: '📖🎨' },
  { at: '14:30', icon: '🚌🚗' }
]
export const DAY_END_DEFAULT = '15:00'
export const DAY_MAX_PARTS = 12

// 'HH:MM' (what <input type="time"> gives) → minutes after midnight, or null.
export function toMin(v) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(v ?? '').trim())
  return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null
}
export const toTime = (n) => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0')

// Whatever is stored or half-typed → parts in time order, one per start
// time, and an end after the last start. Nothing usable → the default day.
function tidy(day, end) {
  const parts = (Array.isArray(day) ? day : [])
    .map((p) => ({ at: toMin(p?.at), icon: [...String(p?.icon ?? '').trim()].slice(0, 8).join(''), sets: SETS.map((x) => x.id).filter((id) => Array.isArray(p?.sets) && p.sets.includes(id)) }))
    .filter((p) => p.at != null && p.at < 1439)
    .sort((a, b) => a.at - b.at)
    .filter((p, i, a) => !i || p.at !== a[i - 1].at)
    .slice(0, DAY_MAX_PARTS)
  if (!parts.length) return tidy(DAY_DEFAULT, DAY_END_DEFAULT)
  const last = parts.at(-1).at
  let e = toMin(end)
  if (e == null || e <= last) e = Math.min(last + 60, 1439)
  return { parts, end: e }
}

// → { day, dayEnd } as stored in settings.
export function normalizeDay(day, end) {
  const t = tidy(day, end)
  return { day: t.parts.map((p) => ({ at: toTime(p.at), icon: p.icon, ...(p.sets.length && { sets: p.sets }) })), dayEnd: toTime(t.end) }
}

// Which part of `day` the clock is in at `now` (minutes after midnight), as
// an index into `day` as it stands (it may be mid-edit and out of order), or
// -1 before the first part and from the end of the day.
export function partAt(day, end, now) {
  let at = -1
  day.forEach((p, i) => {
    const m = toMin(p.at)
    if (m != null && m <= now && (at < 0 || m > toMin(day[at].at))) at = i
  })
  const e = toMin(end)
  return e != null && now >= e ? -1 : at
}

// When part `i` ends: the next start time after it, or the end of the day.
export function partEnd(day, end, i) {
  const from = toMin(day[i]?.at)
  const next = day.map((p) => toMin(p.at)).filter((m) => m != null && m > from)
  return next.length ? toTime(Math.min(...next)) : end
}

// 'HH:MM' as a US clock says it: '14:09' → '2:09'.
export const clock12 = (t) => ((+t.slice(0, 2) + 11) % 12) + 1 + t.slice(2)

// What the bar draws at `now` (minutes after midnight): one entry per part,
// `minutes` long, 'past' | 'now' | 'next', and how far through it we are.
export function daySegments(day, end, now) {
  const t = tidy(day, end)
  return t.parts.map((p, i) => {
    const to = i + 1 < t.parts.length ? t.parts[i + 1].at : t.end
    const state = now >= to ? 'past' : now >= p.at ? 'now' : 'next'
    return { icon: p.icon, minutes: to - p.at, state, frac: state === 'now' ? (now - p.at) / (to - p.at) : 0 }
  })
}
