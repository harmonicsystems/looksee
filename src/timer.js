// A timer: one countdown a teacher starts from the control bar, apart from
// the slides, the plan and the school day. Pure logic; Timer.svelte runs it,
// draws it and keeps it on the device.
//
// A running timer is the moment it ends (`endsAt`), never a number counted
// down: what is left is worked out from the clock each time, so it is still
// right after the tab was in the background or the page was reloaded.
// A paused one holds what was `left`. `total` is its whole length, for the
// ring. `last` is the minutes used last time, `chime` whether it rings.

export const PRESETS = [1, 3, 5, 10, 15]
export const MAX_MIN = 60
const MIN = 60000
// The most a timer can hold, however often a minute is added.
const CAP = 99 * MIN

const minutes = (n) => (Number.isFinite(n) ? Math.min(MAX_MIN, Math.max(1, Math.round(n))) : 5)
const ms = (n) => (Number.isFinite(n) && n > 0 ? Math.min(CAP, n) : 0)
const idle = (t) => ({ last: t.last, chime: t.chime, total: 0, endsAt: 0, left: 0 })

// Whatever is stored → a timer that can be shown. One that makes no sense
// (ends further away than it is long) is dropped; one that ended while the
// page was closed is kept, so "Time's up" still shows.
export function normalizeTimer(raw, now) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const t = { last: minutes(r.last), chime: r.chime !== false, total: ms(r.total), endsAt: 0, left: 0 }
  if (ms(r.left)) t.left = Math.min(ms(r.left), t.total)
  else if (Number.isFinite(r.endsAt) && r.endsAt > 0 && r.endsAt - now <= t.total) t.endsAt = r.endsAt
  return t.total && (t.left || t.endsAt) ? t : idle(t)
}

// 'idle' | 'running' | 'paused' | 'done'. Done stays until it is dismissed.
export const timerState = (t, now) => (t.left ? 'paused' : !t.endsAt ? 'idle' : now < t.endsAt ? 'running' : 'done')

// Milliseconds still to go.
export const remaining = (t, now) => t.left || Math.max(0, t.endsAt - now)

// The share of the timer still to go, 1 → 0, for the ring.
export const share = (t, now) => (t.total ? remaining(t, now) / t.total : 0)

export function startTimer(t, min, now) {
  const m = minutes(min)
  return { ...t, last: m, total: m * MIN, endsAt: now + m * MIN, left: 0 }
}
export const pauseTimer = (t, now) => (timerState(t, now) === 'running' ? { ...t, left: t.endsAt - now, endsAt: 0 } : t)
export const resumeTimer = (t, now) => (t.left ? { ...t, endsAt: now + t.left, left: 0 } : t)
export const endTimer = (t) => idle(t)

// More time: on a running or paused timer it is added; on one that has ended
// it starts a new one of that length.
export function addTime(t, more, now) {
  const st = timerState(t, now)
  if (st === 'idle') return t
  if (st === 'done') return { ...t, total: more, endsAt: now + more, left: 0 }
  const left = Math.min(CAP, remaining(t, now) + more)
  const total = Math.max(left, t.total + more)
  return st === 'paused' ? { ...t, total, left } : { ...t, total, endsAt: now + left }
}

// "4:32". Rounded up, so it reads 0:00 only when the time is up.
export function clockText(left) {
  const s = Math.ceil(left / 1000)
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}

// What is worth saying aloud as the time left goes from `before` to `after`:
// one minute, ten seconds, the end. Nothing else is announced.
export const milestone = (before, after) =>
  before > 0 && after <= 0 ? 'done' : before > 10000 && after <= 10000 ? 'ten' : before > MIN && after <= MIN ? 'minute' : null
