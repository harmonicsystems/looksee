// A timer: one countdown a teacher starts from the control bar, apart from
// the slides, the plan and the school day. Pure logic; Timer.svelte runs it,
// draws it and keeps it on the device.
//
// A running timer is the moment it ends (`endsAt`), never a number counted
// down: what is left is worked out from the clock each time, so it is still
// right after the tab was in the background or the page was reloaded.
// A paused one holds what was `left`. `total` is its whole length, for the
// picture. `last` is the minutes used last time, `chime` whether it rings.
// `face` is how it is drawn (FACES), `big` whether it fills the screen,
// `nums` whether the minutes and seconds show.

export const PRESETS = [1, 3, 5, 10, 15]
// How the time left is drawn: a disc that shrinks, a bar that empties, a dot
// for each minute, an hourglass. In every one, color is the time left.
export const FACES = ['disc', 'bar', 'dots', 'glass']
export const MAX_MIN = 60
const MIN = 60000
// The most a timer can hold, however often a minute is added.
const CAP = 99 * MIN

const minutes = (n) => (Number.isFinite(n) ? Math.min(MAX_MIN, Math.max(1, Math.round(n))) : 5)
const ms = (n) => (Number.isFinite(n) && n > 0 ? Math.min(CAP, n) : 0)
const idle = (t) => ({ ...t, total: 0, endsAt: 0, left: 0 })

// Whatever is stored → a timer that can be shown. One that makes no sense
// (ends further away than it is long) is dropped; one that ended while the
// page was closed is kept, so "Time's up" still shows.
export function normalizeTimer(raw, now) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const t = {
    last: minutes(r.last),
    chime: r.chime !== false,
    face: FACES.includes(r.face) ? r.face : FACES[0],
    big: r.big === true,
    nums: r.nums !== false,
    total: ms(r.total),
    endsAt: 0,
    left: 0
  }
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

// ---- faces ----
// Each face is two outlines in a box of 100 by 100: `faceTrack` is the whole
// shape, `faceFill` the part of it that is time left. `part` is the share of
// the time still to go (1 → 0) and `n` the timer's length in whole minutes,
// which only the dots need.
const r1 = (x) => Math.round(x * 10) / 10
const ring = (x, y, r) => `M${r1(x - r)},${y}a${r},${r} 0 1,0 ${r1(2 * r)},0a${r},${r} 0 1,0 ${r1(-2 * r)},0`
// Dot `i` of `n`: rows of five (ten in a row past twenty minutes), centred.
function dot(i, n) {
  const cols = n <= 5 ? n : n <= 20 ? 5 : 10
  const rows = Math.ceil(n / cols)
  const cell = 100 / Math.max(cols, rows)
  return ring(r1(((i % cols) + 0.5) * cell + (100 - cols * cell) / 2), r1((Math.floor(i / cols) + 0.5) * cell + (100 - rows * cell) / 2), r1(cell * 0.36))
}
const dots = (count, n) => Array.from({ length: count }, (_, i) => dot(i, n)).join('')

export function faceTrack(face, n) {
  if (face === 'bar') return 'M5,35h90v30h-90z'
  if (face === 'dots') return dots(n, n)
  // Two bulbs that meet in the middle, and a cap at each end.
  if (face === 'glass') return 'M12,8h76L50,50zM50,50L88,92h-76zM6,8h88M6,92h88'
  return ring(50, 50, 45)
}

export function faceFill(face, part, n) {
  const p = Math.min(1, Math.max(0, part))
  if (face === 'bar') return `M5,35h${r1(90 * p)}v30h${r1(-90 * p)}z`
  // A dot goes out when its minute is over.
  if (face === 'dots') return dots(Math.ceil(p * n - 1e-9), n)
  if (face === 'glass') {
    // Sand by area, so half the time is half the sand: a triangle's area goes
    // with the square of its height. What has run out lies in the lower bulb.
    const s = Math.sqrt(p)
    const w = r1(38 * s)
    const h = r1(42 * s)
    return `M${r1(50 - w)},${r1(50 - h)}h${r1(2 * w)}L50,50zM${r1(50 - w)},${r1(50 + h)}h${r1(2 * w)}L88,92h-76z`
  }
  // A wedge from twelve o'clock, clockwise, that closes as the time goes.
  if (p > 0.999) return ring(50, 50, 45)
  const a = 2 * Math.PI * p
  return `M50,50V5A45,45 0 ${p > 0.5 ? 1 : 0},1 ${r1(50 + 45 * Math.sin(a))},${r1(50 - 45 * Math.cos(a))}z`
}
