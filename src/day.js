// The school-day bar: a list of parts, each starting at a time and shown as a
// few emoji, plus the time the day ends. Pure logic; Look.svelte draws it.
// The emoji here are plain text in the device's own emoji font — no files.

export const DAY_DEFAULT = [
  { at: '08:00', icon: '✏️📚' },
  { at: '11:30', icon: '🍎🥪' },
  { at: '12:15', icon: '📖🎨' },
  { at: '14:30', icon: '🚌🚗' }
]
export const DAY_END_DEFAULT = '15:00'
export const DAY_MAX_PARTS = 8

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
    .map((p) => ({ at: toMin(p?.at), icon: [...String(p?.icon ?? '').trim()].slice(0, 8).join('') }))
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
  return { day: t.parts.map((p) => ({ at: toTime(p.at), icon: p.icon })), dayEnd: toTime(t.end) }
}

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
